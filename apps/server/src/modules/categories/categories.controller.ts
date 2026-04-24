import type { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '@nuraskin/shared-types';
import * as service from './categories.service';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await service.getCategories();
  res.json(result);
}

export async function get(req: Request, res: Response): Promise<void> {
  const result = await service.getCategory(req.params.id);
  res.json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createCategorySchema.parse(req.body);
  const result = await service.createCategory(input);
  res.status(201).json(result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const input = updateCategorySchema.parse(req.body);
  const result = await service.updateCategory(req.params.id, input);
  res.json(result);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.deleteCategory(req.params.id);
  res.status(204).send();
}

export async function getUploadUrl(req: Request, res: Response): Promise<void> {
  const result = await service.generateUploadUrl();
  res.json(result);
}
