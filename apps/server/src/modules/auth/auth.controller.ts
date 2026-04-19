import type { Request, Response } from 'express';
import { LoginSchema, TelegramAuthSchema } from './auth.schema';
import * as service from './auth.service';

export async function login(req: Request, res: Response): Promise<void> {
  const input = LoginSchema.parse(req.body);
  const result = await service.adminLogin({ input });
  res.status(200).json(result);
}

export async function telegramAuth(req: Request, res: Response): Promise<void> {
  const input = TelegramAuthSchema.parse(req.body);
  const result = await service.telegramAuth({ input });
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json(req.user);
}
