import * as repository from './orders.repository';
import * as productsRepository from '../products/products.repository';
import * as usersRepository from '../users/users.repository';
import {
  db,
  settings,
  inventoryBatches,
  customers,
  orderItems,
  orders,
  stockReservations,
  products,
  orderStatusHistory,
  coupons,
  orderExpenses,
  orderBoxes,
  shippingBoxes,
  exchangeRateSnapshots,
} from '@nuraskin/database';
import { eq, sql, and, asc, gt, or, ilike } from 'drizzle-orm';
import { logger } from '../../common/utils/logger';
import { formatPrice } from '@nuraskin/shared-types';
import { NotificationService } from '../notifications/notification.service';
import {
  calculateUzbPrice,
  calculateKorPrice,
  calculateKorCargo,
  calculateBoxFeeUzs,
} from '../../common/utils/pricing';
import { getActiveBoxes, recommendBoxes } from '../../common/utils/box-recommendation';
import {
  NotFoundError,
  BadRequestError,
  InsufficientStockError,
} from '../../common/errors/AppError';
import type {
  CreateOrderInput,
  AddOrderItemInput,
  UpdateOrderStatusInput,
  CreateManualOrderInput,
  ConfirmManualPaymentInput,
} from '@nuraskin/shared-types';
import type { NewOrder, NewStockReservation } from '@nuraskin/database';

export async function createManualOrder(input: CreateManualOrderInput, adminId: string) {
  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, input.customerId),
    });
    if (!customer) throw new NotFoundError('Mijoz topilmadi');

    const admin = await usersRepository.findById(adminId);
    const adminName = admin?.fullName || 'Admin';

    const finalOrder = await db.transaction(async (tx: any) => {
      const orderNumber = await generateManualOrderNumber();
      const rateSnapshot = await repository.getLatestRateSnapshot();
      const activeBoxes = input.region === 'UZB' ? await getActiveBoxes() : [];

      let totalProductWeight = 0;
      // Check stock and calculate weight
      for (const item of input.items) {
        const product = await productsRepository.findById(item.productId);
        if (product?.weightGrams) {
          totalProductWeight += product.weightGrams * item.quantity;
        }

        const available = await repository.getAvailableStock(item.productId, tx);
        if (item.quantity > available && !input.forceCreate) {
          throw new BadRequestError(`INSUFFICIENT_STOCK: ${product?.name}`, 'INSUFFICIENT_STOCK', {
            productId: item.productId,
            productName: product?.name,
            available,
            requested: item.quantity,
          });
        }
      }

      const { selectedBoxes, boxFeeUzs } = await resolveOrderBox(
        totalProductWeight,
        activeBoxes,
        rateSnapshot,
        input.boxId
      );
      logger.info({ orderNumber, selectedBoxes, boxFeeUzs }, 'Resolved boxes for manual order');

      const orderData: NewOrder = {
        orderNumber,
        customerId: input.customerId,
        regionCode: input.region,
        status: 'PENDING_PAYMENT',
        orderSource: 'MANUAL',
        currency: input.region === 'UZB' ? 'UZS' : 'KRW',
        deliveryAddressLine1: input.deliveryAddress,
        deliveryFeeCharged: BigInt(input.deliveryFeeCharged),
        deliveryFeeActual: BigInt(input.deliveryFeeActual),
        deliveryCoveredBy: input.deliveryFeeCoveredBy,
        cargoFee: BigInt(input.deliveryFeeCharged),
        cargoCostKrw: BigInt(input.deliveryFeeActual),
        boxFeeUzs,
        adminNote: input.adminNotes || null,
        createdBy: adminId,
        rateSnapshotId: rateSnapshot?.id || null,
      };

      const [order] = await tx.insert(orders).values(orderData).returning();
      if (!order) throw new Error('Failed to create manual order');

      // Store selected boxes immediately
      for (const box of selectedBoxes) {
        await tx.insert(orderBoxes).values({
          orderId: order.id,
          boxId: box.boxId,
          quantity: box.quantity,
        });
      }

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        toStatus: order.status,
        changedBy: adminId,
        note: 'Manual order created',
      });

      const itemsForNotification: any[] = [];

      for (const itemInput of input.items) {
        const product = await productsRepository.findById(itemInput.productId);
        if (!product) throw new NotFoundError(`Product ${itemInput.productId} not found`);

        const unitPriceBase = BigInt(itemInput.negotiatedPriceKrw);

        const prices = calculateOrderItemPrices(
          product,
          itemInput.quantity,
          order.regionCode,
          rateSnapshot
        );

        // Override unitPrice and itemCargo using negotiated price if UZB
        let finalUnitPrice = prices.unitPrice;
        let finalItemCargo = prices.itemCargo;

        if (order.regionCode === 'UZB' && rateSnapshot) {
          const rateData = {
            krwToUzs: parseFloat(rateSnapshot.krwToUzs),
            cargoRateKrwPerKg: rateSnapshot.cargoRateKrwPerKg,
          };
          const negotiatedRes = calculateUzbPrice(unitPriceBase, product.weightGrams, rateData);
          finalUnitPrice = negotiatedRes.productPrice;
          finalItemCargo = negotiatedRes.cargoFee;
        } else if (order.regionCode === 'KOR') {
          finalUnitPrice = calculateKorPrice(unitPriceBase);
          finalItemCargo = 0n;
        }

        const subtotal = (finalUnitPrice + finalItemCargo) * BigInt(itemInput.quantity);

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: itemInput.productId,
          quantity: itemInput.quantity,
          retailPriceSnapshot: prices.retailPrice,
          wholesalePriceSnapshot: prices.wholesalePrice,
          unitPriceSnapshot: finalUnitPrice,
          cargoFeeSnapshot: finalItemCargo,
          negotiatedPriceKrw: unitPriceBase,
          subtotalSnapshot: subtotal,
          currencySnapshot: order.currency,
        });

        itemsForNotification.push({
          name: product.name,
          qty: itemInput.quantity,
          subtotal: subtotal,
        });
      }

      await recalculateOrderTotals(order.id, tx);

      // Trigger stock reservation
      const [settingsRow] = await tx.select().from(settings).limit(1);
      await reserveStock(order.id, settingsRow?.paymentTimeoutMinutes || 30, tx);

      const [orderRefreshed] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, order.id))
        .limit(1);

      // Notifications
      if (customer.telegramId) {
        NotificationService.sendManualOrderCreated(
          orderRefreshed.id,
          orderRefreshed.orderNumber,
          orderRefreshed.totalAmount,
          orderRefreshed.regionCode,
          adminName,
          customer.telegramId
        ).catch(err => {
          logger.error(
            { err, orderId: orderRefreshed.id },
            'Failed to send manual order notification to customer'
          );
        });
      }

      NotificationService.sendAdminManualOrderCreated(
        orderRefreshed.id,
        orderRefreshed.orderNumber,
        orderRefreshed.totalAmount,
        orderRefreshed.regionCode,
        customer.fullName,
        adminName
      ).catch(err => {
        logger.error(
          { err, orderId: orderRefreshed.id },
          'Failed to send manual order notification to admin'
        );
      });

      return orderRefreshed;
    });

    return finalOrder;
  } catch (err: any) {
    logger.error({ err, input }, 'createManualOrder failed');
    throw err;
  }
}

export async function confirmManualPayment(
  orderId: string,
  input: ConfirmManualPaymentInput,
  adminId: string
) {
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (!['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'].includes(order.status)) {
    throw new BadRequestError(`Cannot confirm payment for order in ${order.status} status`);
  }

  const result = await db.transaction(async tx => {
    const now = new Date();
    await tx
      .update(orders)
      .set({
        status: 'PAYMENT_CONFIRMED',
        paymentAmount: BigInt(input.paymentAmount),
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference || null,
        paymentNote: input.paymentNote || null,
        paymentConfirmedBy: adminId,
        paymentConfirmedAt: now,
        paymentVerifiedAt: now,
        paymentVerifiedBy: adminId,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: 'PAYMENT_CONFIRMED',
      changedBy: adminId,
      note: `Manual payment confirmed: ${input.paymentMethod}`,
    });

    if (order.cargoCostKrw && BigInt(order.cargoCostKrw) > 0n) {
      await tx.insert(orderExpenses).values({
        orderId,
        type: 'SHIPPING',
        amountKrw: BigInt(order.cargoCostKrw),
        note: `Auto kargo: #${order.orderNumber}`,
        createdBy: adminId,
        isAuto: true,
      });
    }

    // Auto packaging expense based on pre-selected boxes
    if (order.regionCode === 'UZB') {
      const boxes = await tx
        .select({
          quantity: orderBoxes.quantity,
          boxId: orderBoxes.boxId,
          name: shippingBoxes.name,
          costPriceKrw: shippingBoxes.costPriceKrw,
        })
        .from(orderBoxes)
        .innerJoin(shippingBoxes, eq(orderBoxes.boxId, shippingBoxes.id))
        .where(eq(orderBoxes.orderId, orderId));

      for (const box of boxes) {
        if (BigInt(box.costPriceKrw) > 0n) {
          await tx.insert(orderExpenses).values({
            orderId,
            type: 'PACKAGING',
            amountKrw: BigInt(box.costPriceKrw) * BigInt(box.quantity),
            note: `Auto quticha: ${box.quantity}x ${box.name}`,
            createdBy: adminId,
            isAuto: true,
          });
        }
      }
    }

    return await repository.findById(orderId, tx);
  });

  // Notification
  process.nextTick(async () => {
    try {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, order.customerId),
      });
      if (customer?.telegramId) {
        await NotificationService.sendPaymentVerified(
          order.id,
          order.orderNumber,
          input.paymentAmount,
          (order.regionCode as any) || 'UZB',
          customer.telegramId
        );
      }
    } catch (e) {
      logger.error({ e }, 'Failed to send manual payment confirmation notification');
    }
  });

  return result;
}

export async function searchCustomersForManualOrder(q: string) {
  const term = `%${q}%`;
  const results = await db
    .select({
      id: customers.id,
      fullName: customers.fullName,
      telegramUsername: customers.telegramId, // Assuming we might store username or ID
      phone: customers.phone,
      region: customers.regionCode,
      createdAt: customers.createdAt,
      totalOrders: sql<number>`(SELECT count(*)::int FROM orders WHERE orders.customer_id = customers.id)`,
    })
    .from(customers)
    .where(
      or(
        ilike(customers.fullName, term),
        ilike(sql`${customers.telegramId}::text`, term),
        ilike(customers.phone, term)
      )
    )
    .limit(10);

  return results;
}

async function generateManualOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `NSM-${dateStr}-`;

  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(
    db
      .select()
      .from(orders)
      .where(sql`order_number LIKE ${prefix + '%'}`)
      .as('sub')
  );

  const seq = (row?.count || 0) + 1;
  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

/**
 * Resolves which boxes to use for an order and calculates the total box fee in UZS.
 */
async function resolveOrderBox(
  totalWeightGrams: number,
  activeBoxes: any[],
  rateSnapshot: any,
  requestedBoxId?: string
) {
  if (activeBoxes.length === 0 || totalWeightGrams <= 0) {
    return { selectedBoxes: [], boxFeeUzs: 0n };
  }

  const rateData = rateSnapshot
    ? {
        krwToUzs: parseFloat(rateSnapshot.krwToUzs),
        cargoRateKrwPerKg: rateSnapshot.cargoRateKrwPerKg,
      }
    : null;

  if (requestedBoxId) {
    const box = activeBoxes.find(b => b.id === requestedBoxId);
    if (!box) throw new BadRequestError('Tanlangan quti topilmadi');

    // If weight exceeds single box, and it's not the largest box, it's an error
    const sorted = [...activeBoxes].sort((a, b) => b.maxWeightGrams - a.maxWeightGrams);
    const largest = sorted[0];

    let quantity = 1;
    if (totalWeightGrams > box.maxWeightGrams) {
      if (box.id !== largest.id) {
        throw new BadRequestError(
          `Tanlangan quti (${box.name}) juda kichik. Maksimal vazn: ${box.maxWeightGrams}g, jami vazn: ${totalWeightGrams}g`
        );
      }
      quantity = Math.ceil(totalWeightGrams / box.maxWeightGrams);
    }

    const selectedBoxes = [
      {
        boxId: box.id,
        name: box.name,
        quantity,
        tareWeightGrams: box.tareWeightGrams,
        costPriceKrw: box.costPriceKrw,
      },
    ];

    let boxFeeUzs = 0n;
    if (rateData) {
      const singleBoxFee = calculateBoxFeeUzs(box, rateData);
      boxFeeUzs = singleBoxFee * BigInt(quantity);
    }

    return { selectedBoxes, boxFeeUzs };
  } else {
    // Auto-recommend
    const { boxes } = recommendBoxes(totalWeightGrams, activeBoxes);
    let boxFeeUzs = 0n;
    if (rateData && boxes.length > 0) {
      // recommendBoxes only returns one type of box in multiples
      const box = activeBoxes.find(b => b.id === boxes[0].boxId);
      if (box) {
        const singleBoxFee = calculateBoxFeeUzs(box, rateData);
        boxFeeUzs = singleBoxFee * BigInt(boxes[0].quantity);
      }
    }
    // We need costPriceKrw for expenses later
    const boxesWithCost = boxes.map(b => {
      const config = activeBoxes.find(ab => ab.id === b.boxId);
      return { ...b, costPriceKrw: config?.costPriceKrw || 0n };
    });
    return { selectedBoxes: boxesWithCost, boxFeeUzs };
  }
}

export async function createOrder(
  input: CreateOrderInput & {
    couponId?: string | null;
    couponCode?: string | null;
    discountAmount?: bigint;
  },
  txIn?: any
) {
  const runner = txIn || db;
  const orderId = await runner.transaction(async (tx: any) => {
    const orderNumber = await generateOrderNumber();

    const rateSnapshot = await repository.getLatestRateSnapshot();
    if (!rateSnapshot && input.regionCode === 'UZB') {
      throw new BadRequestError('No active rate snapshot found for UZB pricing');
    }

    const activeBoxes = input.regionCode === 'UZB' ? await getActiveBoxes() : [];
    let totalWeightGrams = 0;
    if (input.regionCode === 'UZB') {
      for (const itemInput of input.items) {
        const product = await productsRepository.findById(itemInput.productId);
        if (product) {
          if (product.weightGrams) {
            totalWeightGrams += product.weightGrams * itemInput.quantity;
          } else {
            logger.warn(
              { productId: product.id },
              'Product missing weight_grams. Using 0 for cargo calculation.'
            );
          }
        }
      }
    }

    const { selectedBoxes, boxFeeUzs } = await resolveOrderBox(
      totalWeightGrams,
      activeBoxes,
      rateSnapshot,
      input.boxId
    );
    logger.info({ orderNumber, selectedBoxes, boxFeeUzs }, 'Resolved boxes for order');

    let cargoCostKrw = 0n;
    if (input.regionCode === 'UZB' && rateSnapshot) {
      const weightKg = totalWeightGrams / 1000;
      const cargoRateKrw = Number(rateSnapshot.cargoRateKrwPerKg);
      cargoCostKrw = BigInt(Math.round(weightKg * cargoRateKrw));
    }

    const orderData: NewOrder = {
      orderNumber,
      customerId: input.customerId,
      regionCode: input.regionCode,
      status: 'DRAFT',
      currency: input.currency as any,
      adminNote: input.adminNote || null,
      couponId: input.couponId || null,
      couponCode: input.couponCode || null,
      discountAmount: input.discountAmount || 0n,
      cargoCostKrw,
      boxFeeUzs,
      rateSnapshotId: rateSnapshot?.id || null,
    };

    const [order] = await tx.insert(orders).values(orderData).returning();
    if (!order) throw new Error('Failed to create order');

    // Store selected boxes immediately
    for (const box of selectedBoxes) {
      await tx.insert(orderBoxes).values({
        orderId: order.id,
        boxId: box.boxId,
        quantity: box.quantity,
      });
    }

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: order.status,
      note: 'Order created',
    });

    for (const itemInput of input.items) {
      const product = await productsRepository.findById(itemInput.productId);
      if (!product) throw new NotFoundError(`Product ${itemInput.productId} not found`);

      if (itemInput.quantity > product.totalStock) {
        throw new BadRequestError(
          `INSUFFICIENT_STOCK: ${product.name} mahsulotidan faqat ${product.totalStock} ta mavjud`
        );
      }

      const regionalConfig = product.regionalConfigs.find(c => c.regionCode === input.regionCode);
      if (!regionalConfig)
        throw new BadRequestError(`Product not available in region ${input.regionCode}`);

      const prices = calculateOrderItemPrices(
        product,
        itemInput.quantity,
        input.regionCode,
        rateSnapshot
      );

      const [batch] = await tx
        .select({ costPrice: inventoryBatches.costPrice })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, product.id))
        .orderBy(sql`${inventoryBatches.createdAt} DESC`)
        .limit(1);

      const costAtSaleKrw = batch ? batch.costPrice : 0n;

      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: itemInput.productId,
        quantity: itemInput.quantity,
        retailPriceSnapshot: prices.retailPrice,
        wholesalePriceSnapshot: prices.wholesalePrice,
        unitPriceSnapshot: prices.unitPrice,
        subtotalSnapshot: (prices.unitPrice + prices.itemCargo) * BigInt(itemInput.quantity),
        cargoFeeSnapshot: prices.itemCargo,
        costAtSaleKrw: costAtSaleKrw,
        currencySnapshot: order.currency,
      });
    }

    await recalculateOrderTotals(order.id, tx);
    return order.id;
  });

  return await repository.findById(orderId, runner);
}

interface ItemPriceResult {
  unitPrice: bigint;
  retailPrice: bigint;
  wholesalePrice: bigint;
  itemCargo: bigint;
}

function calculateOrderItemPrices(
  product: any,
  quantity: number,
  regionCode: string,
  rateSnapshot: any
): ItemPriceResult {
  const regionalConfig = product.regionalConfigs.find((c: any) => c.regionCode === regionCode);
  const baseRetailKrw = BigInt(regionalConfig?.retailPrice || 0);
  const baseWholesaleKrw = BigInt(regionalConfig?.wholesalePrice || 0);
  const isWholesale = quantity >= (regionalConfig?.minWholesaleQty || 5);
  const baseKrw = isWholesale ? baseWholesaleKrw : baseRetailKrw;

  if (regionCode === 'UZB' && rateSnapshot) {
    const rateData = {
      krwToUzs: parseFloat(rateSnapshot.krwToUzs),
      cargoRateKrwPerKg: rateSnapshot.cargoRateKrwPerKg,
    };
    const prices = calculateUzbPrice(baseKrw, product.weightGrams, rateData);
    const retailRes = calculateUzbPrice(baseRetailKrw, product.weightGrams, rateData);
    const wholesaleRes = calculateUzbPrice(baseWholesaleKrw, product.weightGrams, rateData);

    return {
      unitPrice: prices.productPrice,
      itemCargo: prices.cargoFee,
      retailPrice: retailRes.productPrice + retailRes.cargoFee,
      wholesalePrice: wholesaleRes.productPrice + wholesaleRes.cargoFee,
    };
  } else {
    return {
      unitPrice: calculateKorPrice(baseKrw),
      retailPrice: calculateKorPrice(baseRetailKrw),
      wholesalePrice: calculateKorPrice(baseWholesaleKrw),
      itemCargo: 0n,
    };
  }
}

async function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `NS-${dateStr}-`;

  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(
    db
      .select()
      .from(orders)
      .where(sql`order_number LIKE ${prefix + '%'}`)
      .as('sub')
  );

  const seq = (row?.count || 0) + 1;
  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

export async function getOrders(filters: any) {
  return await repository.findAll(filters);
}

export async function getOrderDetail(id: string) {
  const order = await repository.findById(id);
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

export async function addOrderItem(orderId: string, input: AddOrderItemInput) {
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'DRAFT') throw new BadRequestError('Can only add items to DRAFT orders');

  const product = await productsRepository.findById(input.productId);
  if (!product) throw new NotFoundError('Product not found');

  const regionalConfig = product.regionalConfigs.find(c => c.regionCode === order.regionCode);
  if (!regionalConfig)
    throw new BadRequestError(`Product not available in region ${order.regionCode}`);

  const rateSnapshot = await repository.getLatestRateSnapshot();
  if (!rateSnapshot && order.regionCode === 'UZB') {
    throw new BadRequestError('No active rate snapshot found for UZB pricing');
  }

  const activeBoxes = order.regionCode === 'UZB' ? await getActiveBoxes() : [];
  let totalProductWeight = 0;
  if (order.regionCode === 'UZB') {
    const existingItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of existingItems) {
      const p = await productsRepository.findById(item.productId);
      totalProductWeight += (p?.weightGrams || 0) * item.quantity;
    }
    totalProductWeight += (product.weightGrams || 0) * input.quantity;
  }

  const prices = calculateOrderItemPrices(product, input.quantity, order.regionCode, rateSnapshot);

  const [batch] = await db
    .select({ costPrice: inventoryBatches.costPrice })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, product.id))
    .orderBy(sql`${inventoryBatches.createdAt} DESC`)
    .limit(1);

  const costAtSaleKrw = batch ? batch.costPrice : 0n;

  return await db.transaction(async tx => {
    await tx.insert(orderItems).values({
      orderId,
      productId: input.productId,
      quantity: input.quantity,
      retailPriceSnapshot: prices.retailPrice,
      wholesalePriceSnapshot: prices.wholesalePrice,
      unitPriceSnapshot: prices.unitPrice,
      subtotalSnapshot: (prices.unitPrice + prices.itemCargo) * BigInt(input.quantity),
      cargoFeeSnapshot: prices.itemCargo,
      costAtSaleKrw: costAtSaleKrw,
      currencySnapshot: order.currency,
    });

    await recalculateOrderTotals(orderId, tx);
    return await repository.findById(orderId);
  });
}

export async function removeOrderItem(orderId: string, itemId: string) {
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (order.status !== 'DRAFT')
    throw new BadRequestError('Can only remove items from DRAFT orders');

  return await db.transaction(async tx => {
    await tx
      .delete(orderItems)
      .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
    await recalculateOrderTotals(orderId, tx);
    return await repository.findById(orderId);
  });
}

async function recalculateOrderTotals(orderId: string, tx: any) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const order = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((rows: any[]) => rows[0]);

  let totalWeight = 0;
  for (const item of items) {
    const product = await productsRepository.findById(item.productId);
    totalWeight += (product?.weightGrams || 0) * item.quantity;
  }

  const activeBoxes = order.regionCode === 'UZB' ? await getActiveBoxes() : [];

  const rateSnapshot = order.rateSnapshotId
    ? await tx
        .select()
        .from(exchangeRateSnapshots)
        .where(eq(exchangeRateSnapshots.id, order.rateSnapshotId))
        .limit(1)
        .then((res: any[]) => res[0])
    : await repository.getLatestRateSnapshot();

  // Get existing box choice to maintain it if possible
  const existingBoxes = await tx.select().from(orderBoxes).where(eq(orderBoxes.orderId, orderId));
  const requestedBoxId = existingBoxes.length > 0 ? existingBoxes[0].boxId : undefined;

  const { selectedBoxes, boxFeeUzs } = await resolveOrderBox(
    totalWeight,
    activeBoxes,
    rateSnapshot,
    requestedBoxId
  );
  logger.info({ orderId, selectedBoxes, boxFeeUzs }, 'Resolved boxes during recalculation');

  // Update orderBoxes
  await tx.delete(orderBoxes).where(eq(orderBoxes.orderId, orderId));
  for (const box of selectedBoxes) {
    await tx.insert(orderBoxes).values({
      orderId,
      boxId: box.boxId,
      quantity: box.quantity,
    });
  }

  // If DRAFT, recalculate based on raw weights (no scaling factor)
  if (order.status === 'DRAFT' && order.regionCode === 'UZB' && rateSnapshot) {
    for (const item of items) {
      const product = await productsRepository.findById(item.productId);
      if (!product) continue;

      const prices = calculateOrderItemPrices(
        product,
        item.quantity,
        order.regionCode,
        rateSnapshot
      );

      await tx
        .update(orderItems)
        .set({
          unitPriceSnapshot: prices.unitPrice,
          cargoFeeSnapshot: prices.itemCargo,
          retailPriceSnapshot: prices.retailPrice,
          wholesalePriceSnapshot: prices.wholesalePrice,
          subtotalSnapshot: (prices.unitPrice + prices.itemCargo) * BigInt(item.quantity),
          updatedAt: new Date(),
        })
        .where(eq(orderItems.id, item.id));
    }
  }

  // Fetch updated items
  const updatedItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  let subtotal = 0n;
  let totalCargo = 0n;

  for (const item of updatedItems) {
    subtotal += item.subtotalSnapshot;
    totalCargo += item.cargoFeeSnapshot;
  }

  if (order.orderSource === 'MANUAL') {
    totalCargo = order.cargoFee;
  } else if (order.regionCode === 'KOR') {
    totalCargo = await calculateKorCargo(subtotal);
  }

  let cargoCostKrw = 0n;
  if (order.regionCode === 'KOR') {
    cargoCostKrw = totalCargo;
  } else if (order.regionCode === 'UZB' && rateSnapshot) {
    const weightKg = totalWeight / 1000;
    const cargoRateKrw = Number(rateSnapshot.cargoRateKrwPerKg);
    cargoCostKrw = BigInt(Math.round(weightKg * cargoRateKrw));
  }

  let discount = BigInt(order.discountAmount || 0n);

  if (order.couponId) {
    const [coupon] = await tx.select().from(coupons).where(eq(coupons.id, order.couponId)).limit(1);
    if (coupon && coupon.type === 'FREE_SHIPPING') {
      discount = totalCargo; // The discount IS the cargo fee
      totalCargo = 0n; // Zero out the cargo fee for the customer
    }
  }

  let totalAmount = 0n;
  if (order.regionCode === 'UZB') {
    // For UZB, subtotal already includes totalCargo (weight-based)
    totalAmount = subtotal + boxFeeUzs - discount;
  } else {
    // For KOR, cargo is calculated separately and not included in subtotalSnapshot
    totalAmount = subtotal + totalCargo + boxFeeUzs - discount;
  }

  if (totalAmount < 0n) totalAmount = 0n;

  await tx
    .update(orders)
    .set({
      subtotal,
      cargoFee: totalCargo,
      cargoCostKrw,
      boxFeeUzs,
      totalAmount,
      totalWeightGrams: totalWeight,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

async function notifyStatusChange(orderId: string, to: string) {
  process.nextTick(async () => {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          customer: true,
        },
      });
      if (!order) return;

      const customer = order.customer;
      const customerTelegramId = customer?.telegramId;
      const orderNumber = order.orderNumber;
      const totalAmount = order.totalAmount;
      const customerName = customer?.fullName || 'Mijoz';
      const region = (order.regionCode as 'UZB' | 'KOR') || 'UZB';

      // Customer notifications
      if (customerTelegramId) {
        if (to === 'PENDING_PAYMENT') {
          // Manual orders call specialized method in createManualOrder
          // This catch-all handles other transitions
          await NotificationService.sendToCustomer(
            customerTelegramId,
            `✅ <b>Buyurtmangiz qabul qilindi!</b>\n\n📦 #${orderNumber}\n💰 Jami: ${formatPrice(totalAmount, region)}\n\nTo'lovni amalga oshiring va kvitansiya yuboring.\n🔗 Buyurtmani ko'rish: https://nuraskin.uz/orders/${orderId}`
          );
        } else if (to === 'PAYMENT_SUBMITTED') {
          await NotificationService.sendPaymentSubmitted(orderId, orderNumber, customerTelegramId);
        } else if (to === 'PAYMENT_CONFIRMED') {
          await NotificationService.sendPaymentVerified(
            orderId,
            orderNumber,
            totalAmount,
            region,
            customerTelegramId
          );
        } else if (to === 'PAYMENT_REJECTED') {
          await NotificationService.sendPaymentRejected(
            orderId,
            orderNumber,
            totalAmount,
            region,
            customerTelegramId
          );
        } else if (to === 'PACKING') {
          await NotificationService.sendOrderPacking(orderId, orderNumber, customerTelegramId);
        } else if (to === 'SHIPPED') {
          await NotificationService.sendOrderShipped(orderId, orderNumber, customerTelegramId);
        } else if (to === 'DELIVERED') {
          await NotificationService.sendOrderDelivered(orderId, orderNumber, customerTelegramId);
        } else if (to === 'CANCELED') {
          await NotificationService.sendOrderCancelled(
            orderId,
            orderNumber,
            totalAmount,
            region,
            customerTelegramId
          );
        } else if (to === 'REFUNDED') {
          await NotificationService.sendOrderRefunded(
            orderId,
            orderNumber,
            totalAmount,
            region,
            customerTelegramId
          );
        }
      }

      // Admin notifications
      if (to === 'PAYMENT_SUBMITTED') {
        await NotificationService.sendAdminPaymentSubmitted(
          orderId,
          orderNumber,
          totalAmount,
          customerName,
          region
        );
      } else if (to === 'CANCELED') {
        await NotificationService.sendAdminCancelled(
          orderId,
          orderNumber,
          totalAmount,
          customerName,
          region
        );
      }
    } catch (e) {
      logger.error({ e, orderId, to }, 'Failed to send status transition notification');
    }
  });
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
  adminId?: string,
  txIn?: any
) {
  const runner = txIn || db;
  const order = await repository.findById(orderId, runner);
  if (!order) throw new NotFoundError('Order not found');

  const toStatus = input.to;

  // DRAFT → PENDING_PAYMENT: reserve stock
  if (toStatus === 'PENDING_PAYMENT' && order.status === 'DRAFT') {
    const result = await runner.transaction(async (tx: any) => {
      const [settingsRow] = await tx.select().from(settings).limit(1);
      const timeoutMinutes = settingsRow?.paymentTimeoutMinutes || 30;
      await reserveStock(orderId, timeoutMinutes, tx);

      await tx
        .update(orders)
        .set({
          status: toStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: order.status,
        toStatus,
        changedBy: adminId,
        note: input.note,
      });

      return await repository.findById(orderId, tx);
    });

    await notifyStatusChange(orderId, toStatus);
    return result;
  }

  // All other transitions go through transitionOrderStatus()
  const result = await transitionOrderStatus(
    orderId,
    toStatus,
    {
      paymentNote: input.paymentNote,
      trackingNumber: input.trackingNumber,
      note: input.note,
    },
    adminId
  );

  await notifyStatusChange(orderId, toStatus);
  return result;
}

interface TransitionInput {
  paymentNote?: string;
  trackingNumber?: string;
  note?: string;
  paymentReceiptUrl?: string;
}

const VALID_TRANSITIONS: Partial<Record<string, string[]>> = {
  PAYMENT_SUBMITTED: ['PENDING_PAYMENT'],
  PAYMENT_CONFIRMED: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED'],
  PAYMENT_REJECTED: ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED'],
  PACKING: ['PAYMENT_CONFIRMED'],
  SHIPPED: ['PACKING', 'PAYMENT_CONFIRMED'],
  DELIVERED: ['SHIPPED'],
  CANCELED: ['DRAFT', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'PACKING'],
};

export async function transitionOrderStatus(
  orderId: string,
  to: string,
  input: TransitionInput,
  adminId?: string
): Promise<any> {
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const validFromStates = VALID_TRANSITIONS[to];
  if (!validFromStates) throw new BadRequestError(`Unknown target status: ${to}`);
  if (!validFromStates.includes(order.status)) {
    throw new BadRequestError(
      `Cannot transition from ${order.status} to ${to}. Valid from: ${validFromStates.join(', ')}`
    );
  }

  if (to === 'SHIPPED' && !input.trackingNumber && !order.trackingNumber) {
    throw new BadRequestError('Tracking number is required to ship an order');
  }

  return await db.transaction(async (tx: any) => {
    const now = new Date();
    const updates: Record<string, any> = {
      status: to,
      updatedAt: now,
    };

    if (input.paymentNote) updates.paymentNote = input.paymentNote;
    if (input.trackingNumber) updates.trackingNumber = input.trackingNumber;

    if (to === 'PAYMENT_SUBMITTED') updates.paymentSubmittedAt = now;
    if (to === 'PAYMENT_CONFIRMED') {
      updates.paymentVerifiedAt = now;
      updates.paymentVerifiedBy = adminId || null;
      updates.paymentConfirmedAt = now;
      updates.paymentConfirmedBy = adminId || null;
    }
    if (to === 'PAYMENT_REJECTED') updates.paymentRejectedAt = now;
    if (to === 'PACKING') {
      updates.packedAt = now;
      updates.packedBy = adminId;
    }
    if (to === 'SHIPPED') {
      updates.shippedAt = now;
      if (!order.packedAt) {
        updates.packedAt = now;
        updates.packedBy = adminId;
      }
    }
    if (to === 'DELIVERED') updates.deliveredAt = now;

    if ((to === 'PAYMENT_CONFIRMED' || to === 'PAYMENT_CONFIRMED') && order.status === 'DRAFT') {
      const [settingsRow] = await tx.select().from(settings).limit(1);
      const timeoutMinutes = settingsRow?.paymentTimeoutMinutes || 30;
      await reserveStock(orderId, timeoutMinutes, tx);
    }

    if (to === 'CANCELED') {
      if (
        ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'PACKING'].includes(
          order.status
        )
      ) {
        await repository.releaseOrderReservations(orderId, tx);
      }
    }

    if (to === 'PAYMENT_REJECTED') {
      if (['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED'].includes(order.status)) {
        await repository.releaseOrderReservations(orderId, tx);
      }
    }

    await tx.update(orders).set(updates).where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: to,
      changedBy: adminId,
      note: input.note || input.paymentNote,
    });

    if (to === 'PAYMENT_CONFIRMED' && order.cargoCostKrw && BigInt(order.cargoCostKrw) > 0n) {
      await tx.insert(orderExpenses).values({
        orderId,
        type: 'SHIPPING',
        amountKrw: BigInt(order.cargoCostKrw),
        note: `Auto kargo: #${order.orderNumber}`,
        createdBy: adminId,
        isAuto: true,
      });
    }

    // Auto packaging expense based on pre-selected boxes
    if (to === 'PAYMENT_CONFIRMED' && order.regionCode === 'UZB') {
      const boxes = await tx
        .select({
          quantity: orderBoxes.quantity,
          boxId: orderBoxes.boxId,
          name: shippingBoxes.name,
          costPriceKrw: shippingBoxes.costPriceKrw,
        })
        .from(orderBoxes)
        .innerJoin(shippingBoxes, eq(orderBoxes.boxId, shippingBoxes.id))
        .where(eq(orderBoxes.orderId, orderId));

      for (const box of boxes) {
        if (BigInt(box.costPriceKrw) > 0n) {
          await tx.insert(orderExpenses).values({
            orderId,
            type: 'PACKAGING',
            amountKrw: BigInt(box.costPriceKrw) * BigInt(box.quantity),
            note: `Auto quticha: ${box.quantity}x ${box.name}`,
            createdBy: adminId || null,
            isAuto: true,
          });
        }
      }
    }

    return await repository.findById(orderId, tx);
  });
}

export async function scanOrderItem(
  orderId: string,
  input: { barcode?: string; sku?: string },
  adminId: string
) {
  // 1. Find order
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Buyurtma topilmadi');

  // 2. Find product by barcode OR sku
  const productResult = await db
    .select()
    .from(products)
    .where(input.barcode ? eq(products.barcode, input.barcode) : eq(products.sku, input.sku!))
    .limit(1);

  const product = productResult[0];
  if (!product) {
    throw new NotFoundError(`Mahsulot topilmadi: ${input.barcode || input.sku}`);
  }

  // 3. Find matching order item
  const itemResult = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.productId, product.id)))
    .limit(1);

  const item = itemResult[0];
  if (!item) {
    throw new NotFoundError(`Bu mahsulot bu buyurtmada yo'q: ${product.name}`);
  }

  // 4. Check if already scanned
  if (item.isScanned) {
    return {
      success: false,
      alreadyScanned: true,
      message: `${product.name} allaqachon skanerlangan`,
      product: {
        name: product.name,
        barcode: product.barcode,
        sku: product.sku,
      },
    };
  }

  // 5. Mark as scanned
  await db
    .update(orderItems)
    .set({
      isScanned: true,
      scannedAt: new Date(),
      scannedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(orderItems.id, item.id));

  // 6. Check if ALL items scanned
  const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  const allScanned = allItems.every(i => (i.id === item.id ? true : i.isScanned));

  // 7. Return result
  return {
    success: true,
    alreadyScanned: false,
    allItemsScanned: allScanned,
    message: `${product.name} skanerlandi ✓`,
    product: {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      sku: product.sku,
    },
    scannedCount: allItems.filter(i => i.isScanned || i.id === item.id).length,
    totalCount: allItems.length,
  };
}

async function reserveStock(orderId: string, timeoutMinutes: number, tx: any) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const order = await tx
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((rows: any[]) => rows[0]);

  for (const item of items) {
    let remainingToReserve = item.quantity;
    const batches = await tx
      .select()
      .from(inventoryBatches)
      .where(
        and(eq(inventoryBatches.productId, item.productId), gt(inventoryBatches.currentQty, 0))
      )
      .orderBy(asc(inventoryBatches.expiryDate), asc(inventoryBatches.createdAt))
      .for('update');

    const reservations: NewStockReservation[] = [];

    for (const batch of batches) {
      if (remainingToReserve <= 0) break;

      const reserveFromThisBatch = Math.min(batch.currentQty, remainingToReserve);

      reservations.push({
        orderId: order.id,
        customerId: order.customerId,
        orderItemId: item.id,
        batchId: batch.id,
        productId: item.productId,
        quantity: reserveFromThisBatch,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
      });
      await tx
        .update(inventoryBatches)
        .set({ currentQty: batch.currentQty - reserveFromThisBatch })
        .where(eq(inventoryBatches.id, batch.id));

      remainingToReserve -= reserveFromThisBatch;
    }

    if (remainingToReserve > 0) {
      throw new InsufficientStockError(`Product ${item.productId} insufficient stock`);
    }

    if (reservations.length > 0) {
      await tx.insert(stockReservations).values(reservations);
    }
  }
}

export async function completePacking(orderId: string, adminId?: string) {
  const order = await repository.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (
    order.status !== 'PACKING' &&
    order.status !== 'PAYMENT_CONFIRMED' &&
    order.status !== 'PAYMENT_CONFIRMED'
  ) {
    throw new BadRequestError('Order is not in correct status for packing');
  }

  const result = await db.transaction(async tx => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      const reservations = await tx
        .select({
          id: stockReservations.id,
          quantity: stockReservations.quantity,
          batchId: stockReservations.batchId,
          costPrice: inventoryBatches.costPrice,
        })
        .from(stockReservations)
        .innerJoin(inventoryBatches, eq(stockReservations.batchId, inventoryBatches.id))
        .where(
          and(eq(stockReservations.orderItemId, item.id), eq(stockReservations.status, 'ACTIVE'))
        );

      let totalCostSum = 0n;
      let totalUnits = 0;

      for (const res of reservations) {
        const costPriceKrw = res.costPrice ? BigInt(res.costPrice) : 0n;
        if (!res.costPrice) {
          logger.warn({ batchId: res.batchId }, 'Batch has missing cost_price_krw. Using 0.');
        }
        totalCostSum += costPriceKrw * BigInt(res.quantity);
        totalUnits += res.quantity;

        await tx
          .update(stockReservations)
          .set({ status: 'CONVERTED', updatedAt: new Date() })
          .where(eq(stockReservations.id, res.id));
      }

      if (totalUnits > 0) {
        const costAtSaleKrw = totalCostSum / BigInt(totalUnits);
        await tx
          .update(orderItems)
          .set({ costAtSaleKrw, updatedAt: new Date() })
          .where(eq(orderItems.id, item.id));
      }
    }

    const now = new Date();
    await tx
      .update(orders)
      .set({
        status: 'SHIPPED',
        packedBy: adminId,
        packedAt: now,
        shippedAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: 'SHIPPED',
      changedBy: adminId,
      note: 'Packing completed',
    });

    return await repository.findById(orderId);
  });

  await tryAddFreeShippingSubsidy(orderId);

  return result;
}

// Deprecated: Shipping is now handled via kor_shipping_tiers and promotions.
// We no longer automatically add a separate subsidy entry for KOR free shipping based on settings.
async function tryAddFreeShippingSubsidy(orderId: string) {
  /* No-op */
}
