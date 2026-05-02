import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
  text,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { customers } from './customers';
import { products } from './products';

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' })
    .unique(),
  regionCode: text('region_code').notNull().default('UZB'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id')
    .notNull()
    .references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  priceSnapshot: bigint('price_snapshot', { mode: 'bigint' }).notNull().default(sql`'0'`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  cartProductUniq: uniqueIndex('cart_items_cart_product_idx').on(t.cartId, t.productId),
}));

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
