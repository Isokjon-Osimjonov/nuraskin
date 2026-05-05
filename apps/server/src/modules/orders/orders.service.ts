import * as repository from './orders.repository';
import * as orderExpensesRepository from './order-expenses.repository';
import * as productsRepository from '../products/products.repository';
import { db, settings, inventoryBatches, customers, orderItems, orders, stockReservations, stockMovements, products, orderStatusHistory, coupons, orderExpenses } from '@nuraskin/database';
import { eq, sql, and, asc, inArray, gt } from 'drizzle-orm';
import { logger } from '../../common/utils/logger';
import { NotificationService } from '../notifications/notification.service';
import { calculateUzbPrice, calculateKorPrice, calculateKorCargo } from '../../common/utils/pricing';
import { reservationTimeoutQueue } from '../queues';
import {
  NotFoundError,
  BadRequestError,
  DebtLimitSoftError,
  DebtLimitHardError,
  InsufficientStockError,
  CannotCancelShippedOrderError,
} from '../../common/errors/AppError';
import type {
  CreateOrderInput,
  AddOrderItemInput,
  UpdateOrderStatusInput,
} from '@nuraskin/shared-types';
import type {
  NewOrder,
  NewOrderItem,
  NewStockReservation,
  NewStockMovement,
} from '@nuraskin/database';

export async function createOrder(input: CreateOrderInput & { couponId?: string | null, couponCode?: string | null, discountAmount?: bigint }, txIn?: any) {
  const runner = txIn || db;
  const orderId = await runner.transaction(async (tx: any) => {
    const orderNumber = await generateOrderNumber();
    
    const rateSnapshot = await repository.getLatestRateSnapshot();
    if (!rateSnapshot && input.regionCode === 'UZB') {
      throw new BadRequestError('No active rate snapshot found for UZB pricing');
    }

    let totalWeightGrams = 0;
    if (input.regionCode === 'UZB') {
      for (const itemInput of input.items) {
        const product = await productsRepository.findById(itemInput.productId);
        if (product) {
          if (product.weightGrams) {
            totalWeightGrams += product.weightGrams * itemInput.quantity;
          } else {
            logger.warn({ productId: product.id }, 'Product missing weight_grams. Using 0 for cargo calculation.');
          }
        }
      }
    }

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
    };

    const [order] = await tx.insert(orders).values(orderData).returning();
    if (!order) throw new Error('Failed to create order');

    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: order.status,
      note: 'Order created',
    });

    for (const itemInput of input.items) {
      const product = await productsRepository.findById(itemInput.productId);
      if (!product) throw new NotFoundError(`Product ${itemInput.productId} not found`);

      const regionalConfig = product.regionalConfigs.find(c => c.regionCode === input.regionCode);
      if (!regionalConfig) throw new BadRequestError(`Product not available in region ${input.regionCode}`);

      let unitPrice = 0n;
      let itemCargo = 0n;

      const baseKrw = itemInput.quantity >= (regionalConfig.minWholesaleQty || 5)
        ? BigInt(regionalConfig.wholesalePrice) 
        : BigInt(regionalConfig.retailPrice);

      if (input.regionCode === 'UZB' && rateSnapshot) {
        const prices = calculateUzbPrice(baseKrw, product.weightGrams, rateSnapshot);
        unitPrice = prices.productPrice + prices.cargoFee;
        itemCargo = 0n;
      } else {
        unitPrice = calculateKorPrice(baseKrw);
        itemCargo = 0n;
      }

      const [batch] = await tx.select({ costPrice: inventoryBatches.costPrice })
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, product.id))
        .orderBy(sql`${inventoryBatches.createdAt} DESC`)
        .limit(1);

      const costAtSaleKrw = batch ? batch.costPrice : 0n;

      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: itemInput.productId,
        quantity: itemInput.quantity,
        unitPriceSnapshot: unitPrice,
        subtotalSnapshot: unitPrice * BigInt(itemInput.quantity),
        cargoFeeSnapshot: itemCargo,
        costAtSaleKrw: costAtSaleKrw,
        currencySnapshot: order.currency,
      });
    }

    await recalculateOrderTotals(order.id, tx);
    return order.id;
  });

  return await repository.findById(orderId, runner);
}

async function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `NS-${dateStr}-`;
  
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(db.select().from(orders).where(sql`order_number LIKE ${prefix + '%'}`).as('sub'));
    
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
  if (!regionalConfig) throw new BadRequestError(`Product not available in region ${order.regionCode}`);

  const rateSnapshot = await repository.getLatestRateSnapshot();
  if (!rateSnapshot && order.regionCode === 'UZB') {
    throw new BadRequestError('No active rate snapshot found for UZB pricing');
  }

  let unitPrice = 0n;
  let itemCargo = 0n;

  const baseKrw = input.quantity >= (regionalConfig.minWholesaleQty || 5)
    ? BigInt(regionalConfig.wholesalePrice) 
    : BigInt(regionalConfig.retailPrice);

  if (order.regionCode === 'UZB' && rateSnapshot) {
    const prices = calculateUzbPrice(baseKrw, product.weightGrams, rateSnapshot);
    unitPrice = prices.productPrice + prices.cargoFee;
    itemCargo = 0n;
  } else {
    unitPrice = calculateKorPrice(baseKrw);
    itemCargo = 0n;
  }

  const [batch] = await db.select({ costPrice: inventoryBatches.costPrice })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, product.id))
    .orderBy(sql`${inventoryBatches.createdAt} DESC`)
    .limit(1);

  const costAtSaleKrw = batch ? batch.costPrice : 0n;

  return await db.transaction(async (tx) => {
    await tx.insert(orderItems).values({
      orderId,
      productId: input.productId,
      quantity: input.quantity,
      unitPriceSnapshot: unitPrice,
      subtotalSnapshot: unitPrice * BigInt(input.quantity),
      cargoFeeSnapshot: itemCargo,
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
  if (order.status !== 'DRAFT') throw new BadRequestError('Can only remove items from DRAFT orders');

  return await db.transaction(async (tx) => {
    await tx.delete(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
    await recalculateOrderTotals(orderId, tx);
    return await repository.findById(orderId);
  });
}

async function recalculateOrderTotals(orderId: string, tx: any) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).then((rows: any[]) => rows[0]);

  let subtotal = 0n;
  let totalCargo = 0n;
  let totalWeight = 0;

  for (const item of items) {
    subtotal += item.subtotalSnapshot;
    totalCargo += item.cargoFeeSnapshot;
    const product = await productsRepository.findById(item.productId);
    totalWeight += (product?.weightGrams || 0) * item.quantity;
  }

  if (order.regionCode === 'KOR') {
    totalCargo = await calculateKorCargo(subtotal);
  }

  const discount = BigInt(order.discountAmount || 0n);
  let totalAmount = subtotal + totalCargo - discount;
  if (totalAmount < 0n) totalAmount = 0n;

  await tx
    .update(orders)
    .set({
      subtotal,
      cargoFee: totalCargo,
      totalAmount,
      totalWeightGrams: totalWeight,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput, adminId?: string, txIn?: any) {
  const runner = txIn || db;
  const order = await repository.findById(orderId, runner);
  if (!order) throw new NotFoundError('Order not found');

  const toStatus = input.to;

  // DRAFT → PENDING_PAYMENT: reserve stock
  if (toStatus === 'PENDING_PAYMENT' && order.status === 'DRAFT') {
    return await runner.transaction(async (tx: any) => {
      const [settingsRow] = await tx.select().from(settings).limit(1);
      const timeoutMinutes = settingsRow?.paymentTimeoutMinutes || 30;
      await reserveStock(orderId, timeoutMinutes, tx);

      await tx.update(orders).set({
        status: toStatus,
        updatedAt: new Date(),
      }).where(eq(orders.id, orderId));

      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: order.status,
        toStatus,
        changedBy: adminId,
        note: input.note,
      });

      return await repository.findById(orderId, tx);
    });
  }

  // All other transitions go through transitionOrderStatus()
  return await transitionOrderStatus(orderId, toStatus, {
    paymentNote: input.paymentNote,
    trackingNumber: input.trackingNumber,
    note: input.note,
  }, adminId);
}

interface TransitionInput {
  paymentNote?: string;
  trackingNumber?: string;
  note?: string;
  paymentReceiptUrl?: string;
}

const VALID_TRANSITIONS: Partial<Record<string, string[]>> = {
  'PAYMENT_SUBMITTED': ['PENDING_PAYMENT'],
  'PAYMENT_VERIFIED': ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAID'],
  'PAYMENT_REJECTED': ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAID'],
  'PACKING': ['PAID', 'PAYMENT_VERIFIED'],
  'SHIPPED': ['PACKING', 'PAID', 'PAYMENT_VERIFIED'],
  'DELIVERED': ['SHIPPED'],
  'CANCELED': ['DRAFT', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PAID', 'PACKING'],
};

export async function transitionOrderStatus(
  orderId: string,
  to: string,
  input: TransitionInput,
  adminId?: string,
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
    if (to === 'PAYMENT_VERIFIED') updates.paymentVerifiedAt = now;
    if (to === 'PAYMENT_REJECTED') updates.paymentRejectedAt = now;
    if (to === 'SHIPPED') {
      updates.shippedAt = now;
      if (!order.packedAt) updates.packedAt = now;
    }
    if (to === 'DELIVERED') updates.deliveredAt = now;

    if ((to === 'PAYMENT_VERIFIED' || to === 'PAID') && (order.status === 'DRAFT' || order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_SUBMITTED')) {
      const [settingsRow] = await tx.select().from(settings).limit(1);
      const timeoutMinutes = settingsRow?.paymentTimeoutMinutes || 30;
      await reserveStock(orderId, timeoutMinutes, tx);
    }

    if (to === 'CANCELED') {
      if (['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PAID', 'PACKING'].includes(order.status)) {
        await repository.releaseOrderReservations(orderId, tx);
      }
    }

    if (to === 'PAYMENT_REJECTED') {
      if (['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAID'].includes(order.status)) {
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

    return await repository.findById(orderId, tx);
  });
}

async function reserveStock(orderId: string, timeoutMinutes: number, tx: any) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).then((rows: any[]) => rows[0]);

  for (const item of items) {
    let remainingToReserve = item.quantity;
    const batches = await tx
      .select()
      .from(inventoryBatches)
      .where(and(eq(inventoryBatches.productId, item.productId), gt(inventoryBatches.currentQty, 0)))
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
        expiresAt: new Date(Date.now() + (timeoutMinutes * 60 * 1000)),
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
  if (order.status !== 'PACKING' && order.status !== 'PAID' && order.status !== 'PAYMENT_VERIFIED') {
    throw new BadRequestError('Order is not in correct status for packing');
  }

  const result = await db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      const reservations = await tx
        .select({
          id: stockReservations.id,
          quantity: stockReservations.quantity,
          batchId: stockReservations.batchId,
          costPrice: inventoryBatches.costPrice
        })
        .from(stockReservations)
        .innerJoin(inventoryBatches, eq(stockReservations.batchId, inventoryBatches.id))
        .where(
          and(
            eq(stockReservations.orderItemId, item.id),
            eq(stockReservations.status, 'ACTIVE')
          )
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

        await tx.update(stockReservations)
          .set({ status: 'CONVERTED', updatedAt: new Date() })
          .where(eq(stockReservations.id, res.id));
      }

      if (totalUnits > 0) {
        const costAtSaleKrw = totalCostSum / BigInt(totalUnits);
        await tx.update(orderItems)
          .set({ costAtSaleKrw, updatedAt: new Date() })
          .where(eq(orderItems.id, item.id));
      }
    }

    const now = new Date();
    await tx.update(orders)
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

async function tryAddFreeShippingSubsidy(orderId: string) {
  try {
    const order = await repository.findById(orderId);
    if (!order || order.regionCode !== 'KOR') return;

    const [settingsRow] = await db.select().from(settings).limit(1);
    if (!settingsRow || !settingsRow.freeShippingThresholdKrw || !settingsRow.standardShippingFeeKrw) return;

    if (BigInt(order.totalAmount) >= BigInt(settingsRow.freeShippingThresholdKrw)) {
      const existing = await db
        .select()
        .from(orderExpenses)
        .where(and(eq(orderExpenses.orderId, orderId), eq(orderExpenses.type, 'FREE_SHIPPING_SUBSIDY')))
        .limit(1);

      if (existing.length === 0) {
        await orderExpensesRepository.create({
          orderId: order.id,
          type: 'FREE_SHIPPING_SUBSIDY',
          amountKrw: BigInt(settingsRow.standardShippingFeeKrw),
          note: `Auto: free shipping for KOR order over ₩${settingsRow.freeShippingThresholdKrw}`,
          isAuto: true,
          createdBy: null as any,
        });
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to auto-create free shipping subsidy');
  }
}
