import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categoryProducts } from './category-products';

// Stub for products table since it doesn't exist but is required for relationships
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    deletedIdx: index('products_deleted_idx').on(t.deletedAt),
  }),
);

export const productsRelations = relations(products, ({ many }) => ({
  categories: many(categoryProducts),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
