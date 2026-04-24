import {
  pgTable,
  uuid,
  varchar,
  integer,
  bigint,
  text,
  date,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { products } from './products';
import { users } from './users';

export const inventoryBatches = pgTable('inventory_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  batchRef: varchar('batch_ref', { length: 100 }),
  initialQty: integer('initial_qty').notNull(),
  currentQty: integer('current_qty').notNull(),
  costPrice: bigint('cost_price', { mode: 'bigint' }).notNull(),
  costCurrency: varchar('cost_currency', { length: 3 }).notNull().default('USD'),
  expiryDate: date('expiry_date'),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productIdIdx: index('inventory_batches_product_id_idx').on(t.productId),
  receivedAtIdx: index('inventory_batches_received_at_idx').on(t.receivedAt),
  expiryDateIdx: index('inventory_batches_expiry_date_idx').on(t.expiryDate),
  initialQtyCheck: check(
    'inventory_batches_initial_qty_check',
    sql`${t.initialQty} > 0`,
  ),
  currentQtyCheck: check(
    'inventory_batches_current_qty_check',
    sql`${t.currentQty} >= 0`,
  ),
}));

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one }) => ({
  product: one(products, {
    fields: [inventoryBatches.productId],
    references: [products.id],
  }),
}));

// APPEND-ONLY — no UPDATE or DELETE ever
// orderId has no inline .references() to avoid circular import with orders.ts
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => inventoryBatches.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  orderId: uuid('order_id'), // FK → orders(id), enforced at application layer
  movementType: varchar('movement_type', { length: 25 }).notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  qtyBefore: integer('qty_before').notNull(),
  qtyAfter: integer('qty_after').notNull(),
  performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productIdIdx: index('stock_movements_product_id_idx').on(t.productId),
  batchIdIdx: index('stock_movements_batch_id_idx').on(t.batchId),
  orderIdIdx: index('stock_movements_order_id_idx').on(t.orderId),
  movementTypeIdx: index('stock_movements_movement_type_idx').on(t.movementType),
  createdAtIdx: index('stock_movements_created_at_idx').on(t.createdAt),
  movementTypeCheck: check(
    'stock_movements_type_check',
    sql`${t.movementType} IN ('STOCK_IN', 'RESERVED', 'RESERVATION_RELEASED', 'DEDUCTED', 'ADJUSTED', 'RETURNED')`,
  ),
}));

// orderId and orderItemId have no inline .references() to avoid circular import
export const stockReservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(), // FK → orders(id), enforced at application layer
  orderItemId: uuid('order_item_id').notNull(), // FK → order_items(id), enforced at application layer
  batchId: uuid('batch_id').notNull().references(() => inventoryBatches.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdIdx: index('stock_reservations_order_id_idx').on(t.orderId),
  orderItemIdIdx: index('stock_reservations_order_item_id_idx').on(t.orderItemId),
  batchIdIdx: index('stock_reservations_batch_id_idx').on(t.batchId),
  productIdIdx: index('stock_reservations_product_id_idx').on(t.productId),
  statusCheck: check(
    'stock_reservations_status_check',
    sql`${t.status} IN ('ACTIVE', 'RELEASED', 'CONVERTED')`,
  ),
}));

export type InventoryBatch = typeof inventoryBatches.$inferSelect;
export type NewInventoryBatch = typeof inventoryBatches.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type StockReservation = typeof stockReservations.$inferSelect;
export type NewStockReservation = typeof stockReservations.$inferInsert;
