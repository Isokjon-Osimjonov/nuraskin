import { db, users, telegramUsers } from '@nuraskin/database';
import { eq } from 'drizzle-orm';
import type { User, TelegramUser, NewTelegramUser } from '@nuraskin/database';

export async function findByEmail(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function findByTelegramId(telegramId: bigint): Promise<TelegramUser | null> {
  const rows = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.telegramId, telegramId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTelegramUser(
  data: NewTelegramUser,
): Promise<TelegramUser> {
  const [row] = await db.insert(telegramUsers).values(data).returning();
  return row;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
