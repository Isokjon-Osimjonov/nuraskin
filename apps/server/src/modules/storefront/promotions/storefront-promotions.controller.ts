import type { Request, Response } from 'express';
import * as service from './storefront-promotions.service';

export async function getActivePromotions(req: Request, res: Response) {
  const promotions = await service.getActivePromotions();
  res.json(promotions);
}
