import {
  pgTable,
  uuid,
  varchar,
  bigint,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'bigint' }).unique(),
  phone: varchar('phone', { length: 20 }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  regionCode: varchar('region_code', { length: 5 }).notNull().default('UZB'),
  debtLimitOverride: bigint('debt_limit_override', { mode: 'bigint' }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  telegramIdIdx: uniqueIndex('customers_telegram_id_idx').on(t.telegramId),
  phoneIdx: index('customers_phone_idx').on(t.phone),
  regionCodeIdx: index('customers_region_code_idx').on(t.regionCode),
  isActiveIdx: index('customers_is_active_idx').on(t.isActive),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
