import type { Request, Response } from 'express';
import * as inventoryService from './inventory.service';
import { addBatchSchema, updateBatchSchema, adjustQuantitySchema } from '@nuraskin/shared-types';

export async function scanProduct(req: Request, res: Response) {
  const { barcode } = req.params;
  const result = await inventoryService.scanProduct(barcode);
  res.json(result);
}

export async function addBatch(req: Request, res: Response) {
  const input = addBatchSchema.parse(req.body);
  const result = await inventoryService.addBatch(input);
  res.status(201).json(result);
}

export async function updateBatch(req: Request, res: Response) {
  const { batchId } = req.params;
  const input = updateBatchSchema.parse(req.body);
  const result = await inventoryService.updateBatch(batchId, input, req.user!.sub);
  res.json(result);
}

export async function adjustQuantity(req: Request, res: Response) {
  const { batchId } = req.params;
  const input = adjustQuantitySchema.parse(req.body);
  const result = await inventoryService.adjustQuantity(batchId, input, req.user!.sub);
  res.json(result);
}

export async function deleteBatch(req: Request, res: Response) {
  const { batchId } = req.params;
  const result = await inventoryService.deleteBatch(batchId);
  res.json(result);
}

export async function getInventoryOverview(req: Request, res: Response) {
  const filters = {
    deleted: req.query.deleted === 'true',
  };
  const result = await inventoryService.getInventoryOverview(filters);
  res.json(result);
}

export async function getProductBatches(req: Request, res: Response) {
  const { productId } = req.params;
  const result = await inventoryService.getProductBatches(productId);
  res.json(result);
}
