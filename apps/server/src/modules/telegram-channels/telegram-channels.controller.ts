import type { Request, Response } from 'express';
import * as service from './telegram-channels.service';
import { createTelegramChannelSchema } from '@nuraskin/shared-types';

export async function listChannels(req: Request, res: Response) {
  const channels = await service.listChannels();
  res.json(channels);
}

export async function addChannel(req: Request, res: Response) {
  const input = createTelegramChannelSchema.parse(req.body);
  const adminId = req.user!.sub;
  const channel = await service.addChannel(input, adminId);
  res.status(201).json(channel);
}

export async function toggleActive(req: Request, res: Response) {
  const channel = await service.toggleActive(req.params.id);
  res.json(channel);
}

export async function removeChannel(req: Request, res: Response) {
  await service.removeChannel(req.params.id);
  res.status(204).end();
}

export async function testConnection(req: Request, res: Response) {
  const { chatId } = req.body;
  if (!chatId) {
      // If chatId is not in body, maybe we are testing existing channel by id
      const channel = await service.testConnection(req.params.chatId || req.body.chatId);
      res.json(channel);
      return;
  }
  const result = await service.testConnection(chatId);
  res.json(result);
}
