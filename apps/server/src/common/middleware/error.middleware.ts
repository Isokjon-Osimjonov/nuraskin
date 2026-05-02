import type { Request, Response, NextFunction } from 'express';
import { AppError, PriceChangedError, UnauthorizedError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof PriceChangedError) {
    logger.warn({ err, path: req.path }, err.message);
    res.status(422).json({
      error: 'PRICE_CHANGED',
      message: err.message,
      changedItems: err.data.changedItems
    });
    return;
  }

  if (err instanceof UnauthorizedError) {
    logger.warn({ err, path: req.path }, err.message);
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: err.message
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, err.message);
    res.status(err.statusCode).json({ error: err.code || err.message, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ err, path: req.path }, 'Validation error');
    res.status(400).json({ error: 'Validation failed', details: err.issues });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
}
