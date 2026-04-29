import type { Request, Response } from 'express';
import * as service from './coupons.service';
import { createCouponSchema, updateCouponSchema } from '@nuraskin/shared-types';

export async function listCoupons(req: Request, res: Response) {
  const filters = {
    status: req.query.status as string,
    search: req.query.search as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };
  const result = await service.listCoupons(filters);
  res.json(result);
}

export async function getCoupon(req: Request, res: Response) {
  const result = await service.getCoupon(req.params.id);
  res.json(result);
}

export async function createCoupon(req: Request, res: Response) {
  const input = createCouponSchema.parse(req.body);
  const result = await service.createCoupon(input);
  res.status(201).json(result);
}

export async function updateCoupon(req: Request, res: Response) {
  const input = updateCouponSchema.parse(req.body);
  const result = await service.updateCoupon(req.params.id, input);
  res.json(result);
}

export async function deleteCoupon(req: Request, res: Response) {
  await service.deleteCoupon(req.params.id);
  res.status(204).end();
}
