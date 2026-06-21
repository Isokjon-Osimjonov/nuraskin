import type { Request, Response } from 'express';
import * as service from './storefront-promotions.service';
import { tryGetCustomerId } from '../storefront.controller';

export async function getActivePromotions(req: Request, res: Response) {
  const customerId = await tryGetCustomerId(req);
  const promotions = await service.getActivePromotions(customerId);
  res.json(promotions);
}
