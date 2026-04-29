import type { Request, Response } from 'express';
import * as service from './users.service';
import { inviteUserSchema, updateUserSchema, changePasswordSchema } from '@nuraskin/shared-types';
import { ForbiddenError } from '../../common/errors/AppError';

export async function listTeam(req: Request, res: Response) {
  const result = await service.listTeam();
  res.json(result);
}

export async function inviteUser(req: Request, res: Response) {
  const input = inviteUserSchema.parse(req.body);
  const result = await service.inviteAdminUser(input);
  res.status(201).json(result);
}

export async function updateUser(req: Request, res: Response) {
  const input = updateUserSchema.parse(req.body);
  const currentUserId = req.user!.sub;
  const result = await service.updateAdminUser(req.params.id, input, currentUserId);
  res.json(result);
}

export async function changePassword(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  const currentUserId = req.user!.sub;
  
  if (currentUserId !== req.params.id) {
    throw new ForbiddenError('Faqat o\'z parolingizni o\'zgartira olasiz');
  }

  await service.changePassword(req.params.id, input);
  res.status(204).end();
}

export async function deleteUser(req: Request, res: Response) {
  const currentUserId = req.user!.sub;
  await service.deleteAdminUser(req.params.id, currentUserId);
  res.status(204).end();
}
