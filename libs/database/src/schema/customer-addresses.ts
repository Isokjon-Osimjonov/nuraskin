import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { customers } from './customers';

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  regionCode: text('region_code').notNull(),
  label: text('label').notNull().default('Manzil'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  
  // UZB fields
  uzbRegion: text('uzb_region'),
  uzbCity: text('uzb_city'),
  uzbStreet: text('uzb_street'),
  
  // KOR fields
  korPostalCode: text('kor_postal_code'),
  korRoadAddress: text('kor_road_address'),
  korDetail: text('kor_detail'),
  korBuilding: text('kor_building'),
  
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  customerIdIdx: index('idx_customer_addresses_customer_id').on(t.customerId),
  regionCodeCheck: check('customer_addresses_region_code_check', sql`${t.regionCode} IN ('UZB', 'KOR')`),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
