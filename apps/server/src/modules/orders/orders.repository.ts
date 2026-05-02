import {
  db,
  orders,
  orderItems,
  orderStatusHistory,
  customers,
  products,
  exchangeRateSnapshots,
  inventoryBatches,
  stockReservations,
  stockMovements,
  pickPackAudit,
} from '@nuraskin/database';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import type {
  Order,
  NewOrder,
  OrderItem,
  NewOrderItem,
  OrderStatusHistory,
  NewOrderStatusHistory,
  NewStockReservation,
  NewStockMovement,
  NewPickPackAudit,
} from '@nuraskin/database';
import { NotFoundError } from '../../common/errors/AppError';

export async function create(orderData: NewOrder) {
  const [order] = await db.insert(orders).values(orderData).returning();
  if (!order) throw new Error('Failed to create order');

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    toStatus: order.status,
    note: 'Order created',
  });

  return order;
}

export async function findAll(filters: {
  status?: string[];
  customerId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const itemCounts = db
    .select({
      orderId: orderItems.orderId,
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(orderItems)
    .groupBy(orderItems.orderId)
    .as('ic');

  let query = db
    .select({
      order: orders,
      customerName: customers.fullName,
      itemCount: sql<number>`coalesce(${itemCounts.count}, 0)`,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(itemCounts, eq(orders.id, itemCounts.orderId));

  const whereClauses = [];
  if (filters.status && filters.status.length > 0) {
    whereClauses.push(inArray(orders.status, filters.status));
  }
  if (filters.customerId) {
    whereClauses.push(eq(orders.customerId, filters.customerId));
  }
  if (filters.startDate) {
    whereClauses.push(sql`${orders.createdAt} >= ${new Date(filters.startDate)}`);
  }
  if (filters.endDate) {
    whereClauses.push(sql`${orders.createdAt} <= ${new Date(filters.endDate)}`);
  }

  if (whereClauses.length > 0) {
    query = query.where(and(...whereClauses)) as any;
  }

  const rows = await query.orderBy(desc(orders.createdAt));

  return rows.map((r) => ({
    ...r.order,
    customerName: r.customerName,
    subtotal: r.order.subtotal.toString(),
    cargoFee: r.order.cargoFee.toString(),
    totalAmount: r.order.totalAmount.toString(),
    itemCount: r.itemCount,
    items: [], // list view usually doesn't need full items, but we need to match interface if any
  }));
}

export async function findById(id: string, txIn: any = db) {
  const runner = txIn;
  const [row] = await runner
    .select({
      order: orders,
      customerName: customers.fullName,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!row) return null;

  const items = await runner
    .select({
      item: orderItems,
      productName: products.name,
      brandName: products.brandName,
      barcode: products.barcode,
      sku: products.sku,
      imageUrls: products.imageUrls,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const [resRow] = await runner
    .select({ earliest: sql`min(${stockReservations.expiresAt})` })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.orderId, id),
      eq(stockReservations.status, 'ACTIVE')
    ));

  return {
    ...row.order,
    customerName: row.customerName,
    subtotal: row.order.subtotal.toString(),
    cargoFee: row.order.cargoFee.toString(),
    totalAmount: row.order.totalAmount.toString(),
    paymentExpiresAt: resRow?.earliest ?? null,
    items: items.map((i) => ({
      ...i.item,
      productName: i.productName,
      brandName: i.brandName,
      barcode: i.barcode,
      sku: i.sku,
      imageUrls: i.imageUrls,
      unitPriceSnapshot: i.item.unitPriceSnapshot.toString(),
      subtotalSnapshot: i.item.subtotalSnapshot.toString(),
    })),
  };
}

export async function addItem(orderId: string, itemData: NewOrderItem) {
  return await db.transaction(async (tx) => {
    const [item] = await tx.insert(orderItems).values(itemData).returning();
    if (!item) throw new Error('Failed to add item to order');

    // Recalculate order totals
    await updateOrderTotals(tx, orderId);

    return item;
  });
}

export async function removeItem(orderId: string, itemId: string) {
  return await db.transaction(async (tx) => {
    await tx.delete(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)));
    await updateOrderTotals(tx, orderId);
  });
}

async function updateOrderTotals(tx: any, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  let subtotal = 0n;
  let totalWeight = 0;

  for (const item of items) {
    subtotal += item.subtotalSnapshot;
    // We need weight from products table, but we don't have it here easily.
    // Usually totals are updated in service layer before saving or here with a join.
  }

  // To be accurate, we need weight from products
  const productsWithWeight = await tx
    .select({ weight: products.weightGrams, itemId: orderItems.id })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  totalWeight = productsWithWeight.reduce((acc: number, p: any) => acc + p.weight, 0);

  // We don't recalculate cargoFee and totalAmount here as they depend on ratesnapshot
  // which might be locked. Service layer should handle the complex logic.
  await tx
    .update(orders)
    .set({
      subtotal,
      totalWeightGrams: totalWeight,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export async function updateStatus(
  id: string,
  fromStatus: string,
  toStatus: string,
  note?: string,
  changedBy?: string,
  paymentData?: Partial<Order>
) {
  return await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: toStatus,
        paymentNote: note,
        ...paymentData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    await tx.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus,
      toStatus,
      note: note || `Status changed from ${fromStatus} to ${toStatus}`,
      changedBy: changedBy || null,
    });
  });
}

export async function getLatestRateSnapshot() {
  const [snapshot] = await db
    .select()
    .from(exchangeRateSnapshots)
    .orderBy(desc(exchangeRateSnapshots.createdAt))
    .limit(1);
  return snapshot;
}

export async function reserveStock(reservations: NewStockReservation[], movements: NewStockMovement[], tx?: any) {
  const d = tx || db;
  await d.insert(stockReservations).values(reservations);
  await d.insert(stockMovements).values(movements);
}

export async function releaseOrderReservations(orderId: string, tx?: any) {
  const d = tx || db;
  
  const activeReservations = await d
    .select()
    .from(stockReservations)
    .where(and(eq(stockReservations.orderId, orderId), eq(stockReservations.status, 'ACTIVE')));

  if (activeReservations.length === 0) return;

  for (const res of activeReservations) {
    // 1. Get current physical stock with FOR UPDATE lock
    const [batch] = await d
      .select({ currentQty: inventoryBatches.currentQty })
      .from(inventoryBatches)
      .where(eq(inventoryBatches.id, res.batchId))
      .for('update');

    const qtyBefore = batch?.currentQty ?? 0;
    const qtyAfter = qtyBefore + res.quantity;

    // 2. Restore physical stock in the batch
    await d.update(inventoryBatches)
      .set({ currentQty: qtyAfter, updatedAt: new Date() })
      .where(eq(inventoryBatches.id, res.batchId));

    // 3. Write stock_movement with accurate snapshots
    await d.insert(stockMovements).values({
      batchId: res.batchId,
      productId: res.productId,
      orderId: res.orderId,
      movementType: 'RESERVATION_RELEASED',
      quantityDelta: res.quantity,
      qtyBefore,
      qtyAfter,
      note: 'Order cancellation/timeout',
    });

    // 4. Mark reservation as RELEASED
    await d.update(stockReservations)
      .set({ status: 'RELEASED', updatedAt: new Date() })
      .where(eq(stockReservations.id, res.id));
  }
}

export async function releaseStock(orderId: string) {
  await db.transaction(async (tx) => {
    await releaseOrderReservations(orderId, tx);
  });
}

export async function addAuditLog(audit: NewPickPackAudit) {
  await db.insert(pickPackAudit).values(audit);
}

export async function markItemScanned(itemId: string, userId: string) {
  await db
    .update(orderItems)
    .set({
      isScanned: true,
      scannedAt: new Date(),
      scannedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(orderItems.id, itemId));
}
