import { db, products, inventoryBatches, stockMovements } from '@nuraskin/database';
import { eq, and, sql, asc } from 'drizzle-orm';
import type { InventoryBatch, NewInventoryBatch, StockMovement, NewStockMovement } from '@nuraskin/database';
import { NotFoundError } from '../../common/errors/AppError';

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

export async function listInventory() {
  return await db
    .select({
      id: products.id,
      name: products.name,
      brandName: products.brandName,
      barcode: products.barcode,
      sku: products.sku,
      imageUrls: products.imageUrls,
      totalStock: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)`,
      batchCount: sql<number>`count(${inventoryBatches.id})::int`,
      earliestExpiry: sql<string>`min(${inventoryBatches.expiryDate})`,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(products.id, inventoryBatches.productId))
    .groupBy(products.id)
    .orderBy(products.name);
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

    return deductions;
  });
}
