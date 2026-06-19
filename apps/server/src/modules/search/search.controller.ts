import { Request, Response, NextFunction } from 'express';
import { globalSearch } from './search.service';
import { globalSearchQuerySchema } from '@nuraskin/shared-types';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = globalSearchQuerySchema.parse(req.query);
    const data = await globalSearch(q);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
