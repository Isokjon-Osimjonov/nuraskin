import {
  pgTable,
  uuid,
  bigint,
  integer,
  varchar,
  text,
  timestamp,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  debtLimitDefault: bigint('debt_limit_default', { mode: 'bigint' }).notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  adminCardNumber: varchar('admin_card_number', { length: 50 }),
  adminCardHolder: varchar('admin_card_holder', { length: 100 }),
  adminCardBank: varchar('admin_card_bank', { length: 100 }),
  adminPhone: varchar('admin_phone', { length: 50 }),
  minOrderUzbUzs: bigint('min_order_uzb_uzs', { mode: 'bigint' }).notNull().default(sql`0`),
  minOrderKorKrw: bigint('min_order_kor_krw', { mode: 'bigint' }).notNull().default(sql`0`),
  freeShippingThresholdKrw: bigint('free_shipping_threshold_krw', { mode: 'bigint' }).notNull().default(sql`200000`),
  standardShippingFeeKrw: bigint('standard_shipping_fee_krw', { mode: 'bigint' }).notNull().default(sql`3000`),
  paymentTimeoutMinutes: integer('payment_timeout_minutes').notNull().default(30),
  telegramUrl: varchar('telegram_url', { length: 200 }),
  instagramUrl: varchar('instagram_url', { length: 200 }),
  websiteUrl: varchar('website_url', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exchangeRateSnapshots = pgTable('exchange_rate_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  krwToUzs: integer('krw_to_uzs').notNull(),
  cargoRateKrwPerKg: integer('cargo_rate_krw_per_kg').notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdByIdx: index('exchange_rate_snapshots_created_by_idx').on(t.createdBy),
  createdAtIdx: index('exchange_rate_snapshots_created_at_idx').on(t.createdAt),
}));

export const korShippingTiers = pgTable('kor_shipping_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  maxOrderKrw: bigint('max_order_krw', { mode: 'bigint' }),
  cargoFeeKrw: bigint('cargo_fee_krw', { mode: 'bigint' }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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
export type KorShippingTier = typeof korShippingTiers.$inferSelect;
export type NewKorShippingTier = typeof korShippingTiers.$inferInsert;
