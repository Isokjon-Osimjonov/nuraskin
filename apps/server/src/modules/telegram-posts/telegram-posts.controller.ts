import type { Request, Response } from 'express';
import * as service from './telegram-posts.service';
import { createTelegramPostSchema, updateTelegramPostSchema } from '@nuraskin/shared-types';

export async function listPosts(req: Request, res: Response) {
  const filters = {
    status: req.query.status as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };
  const result = await service.listPosts(filters);
  res.json(result);
}

export async function getPost(req: Request, res: Response) {
  const post = await service.getPost(req.params.id);
  res.json(post);
}

export async function createPost(req: Request, res: Response) {
  const input = createTelegramPostSchema.parse(req.body);
  const adminId = req.user!.sub;
  const post = await service.createPost(input, adminId);
  res.status(201).json(post);
}

export async function updatePost(req: Request, res: Response) {
  const input = updateTelegramPostSchema.parse(req.body);
  const post = await service.updatePost(req.params.id, input);
  res.json(post);
}

export async function sendPost(req: Request, res: Response) {
  const result = await service.sendPost(req.params.id);
  res.json(result);
}

export async function schedulePost(req: Request, res: Response) {
  const { scheduledAt } = req.body;
  if (!scheduledAt) throw new Error('scheduledAt is required');
  await service.schedulePost(req.params.id, new Date(scheduledAt));
  res.json({ success: true });
}

export async function cancelSchedule(req: Request, res: Response) {
  await service.cancelScheduled(req.params.id);
  res.json({ success: true });
}

export async function generateCaption(req: Request, res: Response) {
  const { productId, postType, language } = req.body;
  const result = await service.generateCaption(productId, postType, language);
  res.json(result);
}

export async function removePost(req: Request, res: Response) {
    await service.removePost(req.params.id);
    res.status(204).end();
}
