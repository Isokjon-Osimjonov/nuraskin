import type { Request, Response } from 'express';
import * as service from './products.service';
import { createProductSchema, updateProductSchema, analyzeImageSchema } from '@nuraskin/shared-types';
import { logger } from '../../common/utils/logger';

export async function list(req: Request, res: Response): Promise<void> {
  const { categoryId, isActive, search, deleted } = req.query;
  const filters = {
    categoryId: categoryId as string | undefined,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    search: search as string | undefined,
    deleted: deleted === 'true',
  };
  const result = await service.listProducts(filters);
  res.json(result);
}

export async function get(req: Request, res: Response): Promise<void> {
  const result = await service.getProduct(req.params.id);
  res.json(result);
}

export async function getByBarcode(req: Request, res: Response): Promise<void> {
  const result = await service.getProductByBarcode(req.params.barcode);
  res.json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createProductSchema.parse(req.body);
  const result = await service.createProduct(input);
  res.status(201).json(result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateProductSchema.parse(req.body);
  const result = await service.updateProduct(req.params.id, input);
  res.json(result);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteProduct(req.params.id);
  res.status(204).send();
}

export async function restore(req: Request, res: Response): Promise<void> {
  const result = await service.restoreProduct(req.params.id);
  res.json(result);
}

export async function analyzeImage(req: Request, res: Response): Promise<void> {
  const { imageUrl } = analyzeImageSchema.parse(req.body);
  const result = await service.analyzeImage(imageUrl);
  res.json(result);
}

export async function updateRegionalConfig(req: Request, res: Response): Promise<void> {
  const { region } = req.params;
  const input = req.body;
  const result = await service.updateRegionalConfig(req.params.id, region, input);
  res.json(result);
}