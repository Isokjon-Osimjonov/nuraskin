import { pgTable, uuid, text, bigint, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const telegramUsers = pgTable(
  'telegram_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    username: text('username'),
    photoUrl: text('photo_url'),
    authDate: timestamp('auth_date', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    telegramIdIdx: index('telegram_users_telegram_id_idx').on(t.telegramId),
  }),
);

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
