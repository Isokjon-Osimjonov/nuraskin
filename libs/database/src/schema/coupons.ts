import {
  pgTable,
  uuid,
  varchar,
  integer,
  bigint,
  text,
  boolean,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { customers } from './customers';
import { products } from './products';
import { categories } from './categories';

export const couponStatusEnum = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED'] as const;
export const couponTypeEnum = ['PERCENTAGE', 'FIXED'] as const;
export const couponScopeEnum = ['ENTIRE_ORDER', 'PRODUCTS', 'CATEGORIES', 'BRANDS'] as const;

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  type: varchar('type', { length: 20 }).notNull().default('PERCENTAGE'), // PERCENTAGE, FIXED
  value: bigint('value', { mode: 'bigint' }).notNull(), // % value or fixed amount in tiyin
  valueUzs: bigint('value_uzs', { mode: 'bigint' }), // tiyin for UZB orders
  valueKrw: bigint('value_krw', { mode: 'bigint' }), // won for KOR orders
  
  maxDiscountCap: bigint('max_discount_cap', { mode: 'bigint' }), // for percentage coupons
  maxDiscountUzs: bigint('max_discount_uzs', { mode: 'bigint' }),
  maxDiscountKrw: bigint('max_discount_krw', { mode: 'bigint' }),
  
  scope: varchar('scope', { length: 20 }).notNull().default('ENTIRE_ORDER'), // ENTIRE_ORDER, PRODUCTS, CATEGORIES, BRANDS
  applicableResourceIds: uuid('applicable_resource_ids').array(), // list of product/category IDs
  applicableBrands: varchar('applicable_brands', { length: 100 }).array(), // list of brand names

  minOrderAmount: bigint('min_order_amount', { mode: 'bigint' }).notNull().default(sql`0`),
  minOrderUzs: bigint('min_order_uzs', { mode: 'bigint' }).default(sql`0`),
  minOrderKrw: bigint('min_order_krw', { mode: 'bigint' }).default(sql`0`),
  
  minOrderQty: integer('min_order_qty').notNull().default(1),
  
  regionCode: varchar('region_code', { length: 3 }), // UZB, KOR or null for all
  
  firstOrderOnly: boolean('first_order_only').notNull().default(false),
  onePerCustomer: boolean('one_per_customer').notNull().default(false),
  
  targetCustomerIds: uuid('target_customer_ids').array(), // null = all
  
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  maxUsesTotal: integer('max_uses_total'),
  maxUsesPerCustomer: integer('max_uses_per_customer').notNull().default(1),
  usageCount: integer('usage_count').notNull().default(0),
  
  autoApply: boolean('auto_apply').notNull().default(false),
  isStackable: boolean('is_stackable').notNull().default(false),
  
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  codeIdx: index('coupons_code_idx').on(t.code),
  statusIdx: index('coupons_status_idx').on(t.status),
  statusCheck: check('coupons_status_check', sql`${t.status} IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')`),
  typeCheck: check('coupons_type_check', sql`${t.type} IN ('PERCENTAGE', 'FIXED')`),
  scopeCheck: check('coupons_scope_check', sql`${t.scope} IN ('ENTIRE_ORDER', 'PRODUCTS', 'CATEGORIES', 'BRANDS')`),
}));

// APPEND-ONLY — no UPDATE or DELETE ever
export const couponRedemptions = pgTable('coupon_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  orderId: uuid('order_id').notNull(), // FK enforced at application layer to avoid circular deps
  discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  couponIdIdx: index('coupon_redemptions_coupon_id_idx').on(t.couponId),
  customerIdIdx: index('coupon_redemptions_customer_id_idx').on(t.customerId),
  orderIdIdx: index('coupon_redemptions_order_id_idx').on(t.orderId),
}));

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type NewCouponRedemption = typeof couponRedemptions.$inferInsert;
