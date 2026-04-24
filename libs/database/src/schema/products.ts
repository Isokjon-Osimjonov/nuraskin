import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  barcode: varchar('barcode', { length: 50 }).notNull().unique(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  brandName: varchar('brand_name', { length: 100 }).notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  descriptionUz: text('description_uz'),
  howToUseUz: text('how_to_use_uz'),
  ingredients: jsonb('ingredients').$type<string[]>().notNull().default([]),
  skinTypes: jsonb('skin_types').$type<string[]>().notNull().default([]),
  benefits: jsonb('benefits').$type<string[]>().notNull().default([]),
  weightGrams: integer('weight_grams').notNull().default(0),
  imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  barcodeIdx: index('products_barcode_idx').on(t.barcode),
  skuIdx: index('products_sku_idx').on(t.sku),
  brandNameIdx: index('products_brand_name_idx').on(t.brandName),
  categoryIdIdx: index('products_category_id_idx').on(t.categoryId),
  deletedAtIdx: index('products_deleted_at_idx').on(t.deletedAt),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
