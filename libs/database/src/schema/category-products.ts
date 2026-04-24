import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { products } from './products';

export const categoryProducts = pgTable(
  'category_products',
  {
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.categoryId, t.productId] }),
    categoryIdx: index('category_products_category_id_idx').on(t.categoryId),
    productIdx: index('category_products_product_id_idx').on(t.productId),
  }),
);

export const categoryProductsRelations = relations(categoryProducts, ({ one }) => ({
  category: one(categories, {
    fields: [categoryProducts.categoryId],
    references: [categories.id],
  }),
  product: one(products, {
    fields: [categoryProducts.productId],
    references: [products.id],
  }),
}));

export type CategoryProduct = typeof categoryProducts.$inferSelect;
export type NewCategoryProduct = typeof categoryProducts.$inferInsert;
