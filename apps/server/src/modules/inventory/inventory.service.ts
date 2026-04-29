import * as repository from './inventory.repository';
import { db, products, inventoryBatches, settings, customers, productWaitlist } from '@nuraskin/database';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';
import { NotificationService } from '../notifications/notification.service';
import type { AddBatchInput, UpdateBatchInput, AdjustQuantityInput } from '@nuraskin/shared-types';
import type { NewInventoryBatch, NewBatchAdjustment } from '@nuraskin/database';

export async function updateBatch(batchId: string, input: UpdateBatchInput, adminId: string) {
  const batch = await repository.getBatchById(batchId);
  if (!batch) throw new NotFoundError('Batch not found');

  const adjustments: NewBatchAdjustment[] = [];
  const updateData: Partial<NewInventoryBatch> = {};

  if (input.batch_ref !== undefined && input.batch_ref !== batch.batchRef) {
    adjustments.push({
      batchId,
      adminId,
      fieldChanged: 'batch_ref',
      oldValue: batch.batchRef || '',
      newValue: input.batch_ref,
    });
    updateData.batchRef = input.batch_ref;
  }

  if (input.initial_qty !== undefined && input.initial_qty !== batch.initialQty) {
    if (batch.currentQty !== batch.initialQty) {
      throw new BadRequestError("Sotilgan partiyaning dastlabki miqdorini o'zgartirib bo'lmaydi");
    }
    adjustments.push({
      batchId,
      adminId,
      fieldChanged: 'initial_qty',
      oldValue: batch.initialQty.toString(),
      newValue: input.initial_qty.toString(),
    });
    updateData.initialQty = input.initial_qty;
    updateData.currentQty = input.initial_qty; // Since currentQty must be equal to initialQty to allow edit
  }

  if (input.cost_price_krw !== undefined) {
    const newPrice = BigInt(input.cost_price_krw);
    if (newPrice !== batch.costPrice) {
      adjustments.push({
        batchId,
        adminId,
        fieldChanged: 'cost_price',
        oldValue: batch.costPrice.toString(),
        newValue: newPrice.toString(),
      });
      updateData.costPrice = newPrice;
    }
  }

  if (input.expiry_date !== undefined) {
    const oldDate = batch.expiryDate;
    const newDate = input.expiry_date ? new Date(input.expiry_date).toISOString().split('T')[0] : null;
    if (newDate !== oldDate) {
      adjustments.push({
        batchId,
        adminId,
        fieldChanged: 'expiry_date',
        oldValue: oldDate || '',
        newValue: newDate || '',
      });
      updateData.expiryDate = newDate;
    }
  }

  if (input.received_at !== undefined) {
    const oldDate = batch.receivedAt.toISOString();
    const newDate = new Date(input.received_at).toISOString();
    if (newDate !== oldDate) {
      adjustments.push({
        batchId,
        adminId,
        fieldChanged: 'received_at',
        oldValue: oldDate,
        newValue: newDate,
      });
      updateData.receivedAt = new Date(newDate);
    }
  }

  return await repository.updateBatch(batchId, updateData as any, adjustments);
}

export async function adjustQuantity(batchId: string, input: AdjustQuantityInput, adminId: string) {
  const batch = await repository.getBatchById(batchId);
  if (!batch) throw new NotFoundError('Batch not found');

  const newQty = batch.currentQty + input.adjustment;

  if (newQty < 0) {
    throw new BadRequestError("Miqdor manfiy bo'la olmaydi");
  }
  if (newQty > batch.initialQty) {
    throw new BadRequestError("Miqdor dastlabki miqdordan oshib ketdi");
  }

  return await repository.adjustBatchQuantity(batchId, newQty, input.adjustment, adminId, input.reason);
}

export async function deleteBatch(batchId: string) {
  const batch = await repository.getBatchById(batchId);
  if (!batch) throw new NotFoundError('Batch not found');

  if (batch.currentQty !== batch.initialQty) {
    throw new BadRequestError("Foydalanilgan partiyani o'chirib bo'lmaydi");
  }

  const result = await repository.deleteBatch(batchId);
  if (!result || result.length === 0) throw new NotFoundError('Batch not found');
  return { success: true };
}

export async function scanProduct(input: string) {
  const result = await repository.findByBarcodeOrSku(input);
  if (!result) throw new NotFoundError('Product not found with this scan');
  return result;
}

export async function addBatch(input: AddBatchInput) {
  const isKrw = input.costCurrency === 'KRW';
  
  const batchData: NewInventoryBatch = {
    productId: input.productId,
    batchRef: input.batchRef || null,
    initialQty: input.initialQty,
    currentQty: input.initialQty,
    costPrice: BigInt(Math.round(isKrw ? input.costPrice : input.costPrice * 100)),
    costCurrency: input.costCurrency,
    expiryDate: input.expiryDate ? new Date(input.expiryDate).toISOString().split('T')[0] : null,
    notes: input.notes || null,
  };

  const movementData = {
    productId: input.productId,
    movementType: 'STOCK_IN' as const,
    quantityDelta: input.initialQty,
    note: input.notes || 'Manual stock-in',
  };

  const result = await repository.createBatch(batchData, movementData);

  // Check for low stock
  const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  const [stockRow] = await db
    .select({ total: sql<number>`coalesce(sum(${inventoryBatches.currentQty})::int, 0)` })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.productId, input.productId));
  const [settingsRow] = await db.select().from(settings).limit(1);

  if (product && stockRow && settingsRow) {
    if (stockRow.total < (settingsRow.lowStockThreshold || 10)) {
      await NotificationService.sendAdminLowStock(product.name, stockRow.total);
    }
  }

  // Trigger Waitlist Notifications
  process.nextTick(async () => {
    try {
      if (!product) return;

      const waitlist = await db
        .select()
        .from(productWaitlist)
        .where(and(
          eq(productWaitlist.productId, input.productId),
          isNull(productWaitlist.notifiedAt)
        ));

      for (const entry of waitlist) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, entry.customerId)).limit(1);
        if (customer && customer.telegramId) {
          await NotificationService.sendRestockNotification(product, customer as any);
          await db.update(productWaitlist)
            .set({ notifiedAt: new Date() })
            .where(eq(productWaitlist.id, entry.id));
        }
      }
    } catch (err) {
      console.error('Waitlist notification error:', err);
    }
  });

  return result;
}

export async function getInventoryOverview(filters?: { deleted?: boolean }) {
  return await repository.listInventory(filters);
}

export async function getAvailableStock(productId: string) {
  return await repository.getAvailableStock(productId);
}

export async function getProductBatches(productId: string) {
  return await repository.getBatchesByProductId(productId);
}
