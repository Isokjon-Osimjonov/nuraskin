import {
  pgTable,
  uuid,
  bigint,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  debtLimitDefault: bigint('debt_limit_default', { mode: 'bigint' }).notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  adminCardNumber: varchar('admin_card_number', { length: 50 }),
  adminCardHolder: varchar('admin_card_holder', { length: 100 }),
  adminCardBank: varchar('admin_card_bank', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exchangeRateSnapshots = pgTable('exchange_rate_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  usdToUzs: bigint('usd_to_uzs', { mode: 'bigint' }).notNull(),
  usdToKrw: bigint('usd_to_krw', { mode: 'bigint' }).notNull(),
  cargoRateUsdPerKg: integer('cargo_rate_usd_per_kg').notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdByIdx: index('exchange_rate_snapshots_created_by_idx').on(t.createdBy),
  createdAtIdx: index('exchange_rate_snapshots_created_at_idx').on(t.createdAt),
}));

export const exchangeRateSnapshotsRelations = relations(exchangeRateSnapshots, ({ one }) => ({
  createdByUser: one(users, {
    fields: [exchangeRateSnapshots.createdBy],
    references: [users.id],
  }),
}));

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type ExchangeRateSnapshot = typeof exchangeRateSnapshots.$inferSelect;
export type NewExchangeRateSnapshot = typeof exchangeRateSnapshots.$inferInsert;
