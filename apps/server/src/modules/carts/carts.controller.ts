import type { Request, Response } from 'express';
import * as service from './carts.service';
import { addToCartSchema, updateItemQuantitySchema } from '@nuraskin/shared-types';
import { BadRequestError } from '../../common/errors/AppError';

export async function getCart(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const result = await service.getCart(customerId);
  res.json(result);
}

export async function addToCart(req: Request, res: Response) {
  const { productId, quantity } = addToCartSchema.parse(req.body);
  const regionCode = req.body.regionCode || req.query.region;
  
  if (!regionCode || typeof regionCode !== 'string') {
    throw new BadRequestError('Mintaqa kodi (regionCode) ko\'rsatilmagan');
  }

  const customerId = (req as any).customer.id;
  const result = await service.addToCart(customerId, productId, quantity, regionCode);
  res.json(result);
}

export async function updateItemQuantity(req: Request, res: Response) {
  const { quantity } = updateItemQuantitySchema.parse(req.body);
  const itemId = req.params.itemId;
  const customerId = (req as any).customer.id;
  const result = await service.updateItemQuantity(customerId, itemId, quantity);
  res.json(result);
}

export async function removeItem(req: Request, res: Response) {
  const itemId = req.params.itemId;
  const customerId = (req as any).customer.id;
  const result = await service.removeItem(customerId, itemId);
  res.json(result);
}

export async function clearCart(req: Request, res: Response) {
  const customerId = (req as any).customer.id;
  const { regionCode } = req.body;
  const result = await service.clearCart(customerId, regionCode);
  res.json(result);
}
