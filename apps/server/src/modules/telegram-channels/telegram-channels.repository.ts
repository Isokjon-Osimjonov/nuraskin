import { db, telegramChannels, telegramPostChannels } from '@nuraskin/database';
import { eq, and, sql, desc, isNull } from 'drizzle-orm';
import type { NewTelegramChannel, TelegramChannel } from '@nuraskin/database';

export async function create(data: NewTelegramChannel) {
  const [row] = await db.insert(telegramChannels).values(data).returning();
  return row;
}

export async function findAll() {
  return await db.select().from(telegramChannels).orderBy(desc(telegramChannels.createdAt));
}

export async function findById(id: string) {
  const [row] = await db.select().from(telegramChannels).where(eq(telegramChannels.id, id)).limit(1);
  return row || null;
}

export async function findByChatId(chatId: string) {
  const [row] = await db.select().from(telegramChannels).where(eq(telegramChannels.chatId, chatId)).limit(1);
  return row || null;
}

export async function update(id: string, data: Partial<TelegramChannel>) {
  const [row] = await db.update(telegramChannels).set({ ...data, updatedAt: new Date() }).where(eq(telegramChannels.id, id)).returning();
  return row;
}

export async function remove(id: string) {
  // Check if any posts were sent to this channel
  const [post] = await db.select().from(telegramPostChannels).where(eq(telegramPostChannels.channelId, id)).limit(1);
  if (post) throw new Error('Cannot delete channel that has history of posts');
  
  await db.delete(telegramChannels).where(eq(telegramChannels.id, id));
}
