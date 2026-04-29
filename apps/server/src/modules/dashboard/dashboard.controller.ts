import type { Request, Response } from 'express';
import * as service from './dashboard.service';

export async function getKPIs(req: Request, res: Response) {
  const region = (req.query.region as string) || 'ALL';
  const result = await service.getKPIs(region);
  res.json(result);
}

export async function getTrend(req: Request, res: Response) {
  const region = (req.query.region as string) || 'ALL';
  const result = await service.getTrend(region);
  res.json(result);
}
