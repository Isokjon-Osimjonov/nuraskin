import type { Request, Response } from 'express';
import * as service from './health.service';

export async function check(req: Request, res: Response): Promise<void> {
  const result = await service.getHealth();
  res.json(result);
}
