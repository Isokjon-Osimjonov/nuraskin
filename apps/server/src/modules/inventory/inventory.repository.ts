import { db, products, inventoryBatches, stockMovements, stockReservations, productWaitlist, batchAdjustments } from '@nuraskin/database';
import { eq, and, sql, asc, isNull, isNotNull, gt } from 'drizzle-orm';
import type { InventoryBatch, NewInventoryBatch, StockMovement, NewStockMovement, NewBatchAdjustment } from '@nuraskin/database';
import { NotFoundError } from '../../common/errors/AppError';

export async function getBatchById(batchId: string, tx?: any) {
  const d = tx || db;
  const [batch] = await d.select().from(inventoryBatches).where(eq(inventoryBatches.id, batchId)).limit(1);
  return batch;
}

export async function updateBatch(
  batchId: string,
  data: Partial<InventoryBatch>,
  adjustments: NewBatchAdjustment[]
) {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(inventoryBatches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inventoryBatches.id, batchId))
      .returning();

    if (!updated) throw new NotFoundError('Batch not found');

    if (adjustments.length > 0) {
      await tx.insert(batchAdjustments).values(adjustments);
    }

    return {
      ...updated,
      costPrice: updated.costPrice.toString(),
    };
  });
}

export async function adjustBatchQuantity(
  batchId: string,
  newQty: number,
  adjustment: number,
  adminId: string,
  reason: string
) {
  return await db.transaction(async (tx) => {
    const [batch] = await tx
      .select()
      .from(inventoryBatches)
      .where(eq(inventoryBatches.id, batchId))
      .for('update')
      .limit(1);

    if (!batch) throw new NotFoundError('Batch not found');

    const [updated] = await tx
      .update(inventoryBatches)
      .set({ currentQty: newQty, updatedAt: new Date() })
      .where(eq(inventoryBatches.id, batchId))
      .returning();

    // Insert adjustment
    await tx.insert(batchAdjustments).values({
      batchId,
      adminId,
      fieldChanged: 'quantity',
      oldValue: batch.currentQty.toString(),
      newValue: newQty.toString(),
      reason,
    });

    // Insert movement
    await tx.insert(stockMovements).values({
      productId: batch.productId,
      batchId,
      movementType: adjustment > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      quantityDelta: adjustment,
      qtyBefore: batch.currentQty,
      qtyAfter: newQty,
      performedBy: adminId,
      note: reason,
    });

    return {
      ...updated,
      costPrice: updated.costPrice.toString(),
    };
  });
}

export async function deleteBatch(batchId: string) {
  return await db.delete(inventoryBatches).where(eq(inventoryBatches.id, batchId)).returning();
}

export async function getAvailableStock(productId: string, tx?: any) {
  const d = tx || db;
  
  const [stockRow] = await d
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId));

  const [reservedRow] = await d
    .select({ total: sql<number>`coalesce(sum(${stockReservations.quantity})::int, 0)` })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.productId, productId),
      eq(stockReservations.status, 'ACTIVE'),
      gt(stockReservations.expiresAt, new Date())
    ));

  const physical = stockRow?.total ?? 0;
  const reserved = reservedRow?.total ?? 0;
  
  return Math.max(0, physical - reserved);
}

export async function findByBarcodeOrSku(input: string) {
  // Try exact barcode match first
  let [product] = await db
    .select()
    .from(products)
    .where(eq(products.barcode, input))
    .limit(1);

  if (!product && input.length >= 6) {
    // Try SKU suffix match (last 6 chars)
    [product] = await db
      .select()
      .from(products)
      .where(sql`${products.sku} LIKE ${'%' + input.slice(-6)}`)
      .limit(1);
  }

  if (!product) return null;

  const [stockRow] = await db
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, product.id));

  return { ...product, totalStock: stockRow?.total ?? 0 };
}

export async function createBatch(
  batchData: NewInventoryBatch,
  movementData: Omit<NewStockMovement, 'batchId' | 'qtyBefore' | 'qtyAfter'>
) {
  return await db.transaction(async (tx) => {
    const [batch] = await tx.insert(inventoryBatches).values(batchData).returning();
    if (!batch) throw new Error('Failed to create batch');

    await tx.insert(stockMovements).values({
      ...movementData,
      batchId: batch.id,
      qtyBefore: 0,
      qtyAfter: batch.initialQty,
    });

    return {
      ...batch,
      costPrice: batch.costPrice.toString(),
    };
  });
}

export async function listInventory(filters?: { deleted?: boolean }) {
  const query = db
    .select({
      id: products.id,
      name: products.name,
      brandName: products.brandName,
      barcode: products.barcode,
      sku: products.sku,
      imageUrls: products.imageUrls,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
      activeBatchCount: sql<number>`count(DISTINCT ${inventoryBatches.id}) FILTER (WHERE ${inventoryBatches.currentQty} > 0)::int`,
      earliestExpiry: sql<string>`min(${inventoryBatches.expiryDate})`,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .where(filters?.deleted ? isNotNull(products.deletedAt) : isNull(products.deletedAt))
    .groupBy(products.id)
    .orderBy(products.name);

  return await query;
}

export async function getBatchesByProductId(productId: string) {
  const batches = await db
    .select()
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, productId))
    .orderBy(asc(inventoryBatches.receivedAt));

  return batches.map((b) => ({
    ...b,
    costPrice: b.costPrice.toString(),
  }));
}

/**
 * Deducts stock from batches using FIFO (First-In-First-Out).
 * Returns the list of batches and quantities used.
 */
export async function deductFIFO(productId: string, quantity: number, orderId?: string) {
  return await db.transaction(async (tx) => {
    const batches = await tx
      .select()
      .from(inventoryBatches)
      .where(and(eq(inventoryBatches.productId, productId), sql`${inventoryBatches.currentQty} > 0`))
      .orderBy(asc(inventoryBatches.receivedAt));

    let remainingToDeduct = quantity;
    const deductions: { batchId: string; quantity: number }[] = [];

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductFromThisBatch = Math.min(batch.currentQty, remainingToDeduct);
      const newQty = batch.currentQty - deductFromThisBatch;

      await tx
        .update(inventoryBatches)
        .set({ currentQty: newQty, updatedAt: new Date() })
        .where(eq(inventoryBatches.id, batch.id));

      await tx.insert(stockMovements).values({
        productId,
        batchId: batch.id,
        orderId,
        movementType: 'DEDUCTED',
        quantityDelta: -deductFromThisBatch,
        qtyBefore: batch.currentQty,
        qtyAfter: newQty,
      });

      deductions.push({ batchId: batch.id, quantity: deductFromThisBatch });
      remainingToDeduct -= deductFromThisBatch;
    }

    if (remainingToDeduct > 0) {
      throw new Error(`Insufficient stock for product ${productId}. Missing ${remainingToDeduct} units.`);
    }

    // Reset waitlist notifications if stock is exhausted
    const available = await getAvailableStock(productId, tx);
    if (available === 0) {
      await tx.update(productWaitlist)
        .set({ notifiedAt: null })
        .where(eq(productWaitlist.productId, productId));
    }

    return deductions;
  });
}
