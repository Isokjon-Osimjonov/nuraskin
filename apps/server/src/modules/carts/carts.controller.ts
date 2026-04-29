import type { Request, Response } from 'express';
import * as service from './carts.service';
import { addToCartSchema, updateItemQuantitySchema } from '@nuraskin/shared-types';

export async function getCart(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const result = await service.getCart(customerId);
  res.json(result);
}

export async function addToCart(req: Request, res: Response) {
  const { productId, quantity } = addToCartSchema.parse(req.body);
  const customerId = (req as any).customer.id;
  const result = await service.addToCart(customerId, productId, quantity);
  res.json(result);
}

export async function updateItemQuantity(req: Request, res: Response) {
  const { quantity } = updateItemQuantitySchema.parse(req.body);
  const productId = req.params.productId;
  const customerId = (req as any).customer.id;
  const result = await service.updateItemQuantity(customerId, productId, quantity);
  res.json(result);
}

export async function removeItem(req: Request, res: Response) {
  const productId = req.params.productId;
  const customerId = (req as any).customer.id;
  const result = await service.removeItem(customerId, productId);
  res.json(result);
}

export async function clearCart(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  await service.clearCart(customerId);
  res.status(204).end();
}
