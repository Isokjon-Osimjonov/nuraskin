import type { Request, Response } from 'express';
import * as service from './exchange-rates.service';
import { createExchangeRateSchema } from '@nuraskin/shared-types';

export async function getLatest(req: Request, res: Response) {
  const result = await service.getLatestRate();
  res.json(result);
}

export async function list(req: Request, res: Response) {
  const result = await service.listRates();
  res.json(result);
}

export async function create(req: Request, res: Response) {
  const input = createExchangeRateSchema.parse(req.body);
  const userId = (req as any).user.id;
  const result = await service.addRate(input, userId);
  res.status(201).json(result);
}
