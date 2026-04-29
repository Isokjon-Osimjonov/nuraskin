import * as repository from './telegram-channels.repository';
import { bot } from '../notifications/bot';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';
import type { CreateTelegramChannelInput } from '@nuraskin/shared-types';

export async function listChannels() {
  return await repository.findAll();
}

export async function addChannel(input: CreateTelegramChannelInput, adminId: string) {
  const existing = await repository.findByChatId(input.chatId);
  if (existing) throw new BadRequestError('Channel with this Chat ID already exists');

  // Validate connection before adding
  const test = await testConnection(input.chatId);
  if (!test.ok) throw new BadRequestError(`Telegram connection failed: ${test.error}`);

  return await repository.create({
    ...input,
    addedBy: adminId,
  });
}

export async function testConnection(chatId: string) {
  try {
    const chat = await bot.api.getChat(chatId);
    return { 
      ok: true, 
      title: 'title' in chat ? chat.title : (chat as any).first_name || 'Group' 
    };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function toggleActive(id: string) {
  const channel = await repository.findById(id);
  if (!channel) throw new NotFoundError('Channel not found');
  
  return await repository.update(id, { isActive: !channel.isActive });
}

export async function removeChannel(id: string) {
  try {
    await repository.remove(id);
  } catch (error: any) {
    throw new BadRequestError(error.message);
  }
}
