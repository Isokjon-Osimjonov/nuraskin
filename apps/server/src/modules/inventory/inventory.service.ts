import * as repository from './inventory.repository';
import { NotFoundError } from '../../common/errors/AppError';
import type { AddBatchInput } from '@nuraskin/shared-types';
import type { NewInventoryBatch } from '@nuraskin/database';

export async function scanProduct(input: string) {
  const result = await repository.findByBarcodeOrSku(input);
  if (!result) throw new NotFoundError('Product not found with this scan');
  return result;
}

export async function addBatch(input: AddBatchInput) {
  const batchData: NewInventoryBatch = {
    productId: input.productId,
    batchRef: input.batchRef || null,
    initialQty: input.initialQty,
    currentQty: input.initialQty,
    costPrice: BigInt(Math.round(input.costPrice * 100)), // Convert to cents
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

  return await repository.createBatch(batchData, movementData);
}

export async function getInventoryOverview() {
  return await repository.listInventory();
}

export async function getProductBatches(productId: string) {
  return await repository.getBatchesByProductId(productId);
}
