import type { Request, Response } from 'express';
import * as inventoryService from './inventory.service';
import { addBatchSchema } from '@nuraskin/shared-types';

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

export async function getInventoryOverview(req: Request, res: Response) {
  const result = await inventoryService.getInventoryOverview();
  res.json(result);
}

export async function getProductBatches(req: Request, res: Response) {
  const { productId } = req.params;
  const result = await inventoryService.getProductBatches(productId);
  res.json(result);
}
