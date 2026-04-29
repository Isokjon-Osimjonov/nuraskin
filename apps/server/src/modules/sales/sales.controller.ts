import type { Request, Response } from 'express';
import * as service from './sales.service';
import { runSalesRollup } from '../../jobs/sales-rollup.job';
import { salesRollupQueue } from '../queues';
import { BadRequestError, ForbiddenError } from '../../common/errors/AppError';

export async function getLiveSales(req: Request, res: Response) {
  const { from, to, region } = req.query;
  if (!from || !to) throw new BadRequestError('from and to dates are required');
  const result = await service.getLiveSales(from as string, to as string, region as string);
  res.json(result);
}

export async function getSummarySales(req: Request, res: Response) {
  const { from, to, region } = req.query;
  if (!from || !to) throw new BadRequestError('from and to dates are required');
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
