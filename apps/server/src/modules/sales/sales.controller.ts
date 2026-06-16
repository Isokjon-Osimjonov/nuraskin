import type { Request, Response } from 'express';
import * as service from './sales.service';
import { salesRollupQueue } from '../queues';
import { BadRequestError, ForbiddenError } from '../../common/errors/AppError';

export async function getLiveSales(req: Request, res: Response) {
  const { from, to, region } = req.query;
  const result = await service.getLiveSales(from as string, to as string, region as string);
  res.json(result);
}

export async function list(req: Request, res: Response) {
  const { from, to, region, page, limit } = req.query;
  const result = await service.listSalesOrders(
    from as string,
    to as string,
    region as string,
    page ? parseInt(page as string) : 1,
    limit ? parseInt(limit as string) : 10
  );
  res.json(result);
}

export async function getSummarySales(req: Request, res: Response) {
  const { from, to, region } = req.query;
  const result = await service.getSummarySales(from as string, to as string, region as string);
  res.json(result);
}

export async function triggerManualRollup(req: Request, res: Response) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only SUPER_ADMIN can trigger manual rollup');
  }
  const { date } = req.body;
  await salesRollupQueue.add('manual-rollup', { date });
  res.json({ queued: true, date: date || 'yesterday' });
}
