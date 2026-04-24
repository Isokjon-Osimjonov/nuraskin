import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { orders, orderItems } from './orders';
import { users } from './users';

// APPEND-ONLY — no UPDATE or DELETE ever
export const pickPackAudit = pgTable('pick_pack_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
  performedBy: uuid('performed_by').notNull().references(() => users.id),
  action: varchar('action', { length: 30 }).notNull(),
  scanInput: varchar('scan_input', { length: 100 }),
  expectedBarcode: varchar('expected_barcode', { length: 50 }),
  result: varchar('result', { length: 10 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orderIdIdx: index('pick_pack_audit_order_id_idx').on(t.orderId),
  orderItemIdIdx: index('pick_pack_audit_order_item_id_idx').on(t.orderItemId),
  performedByIdx: index('pick_pack_audit_performed_by_idx').on(t.performedBy),
  createdAtIdx: index('pick_pack_audit_created_at_idx').on(t.createdAt),
  actionCheck: check(
    'pick_pack_audit_action_check',
    sql`${t.action} IN ('SCAN_SUCCESS', 'SCAN_MISMATCH', 'MANUAL_FALLBACK', 'ITEM_CONFIRMED', 'ORDER_PACKED')`,
  ),
  resultCheck: check('pick_pack_audit_result_check', sql`${t.result} IN ('OK', 'ERROR')`),
}));

export const pickPackAuditRelations = relations(pickPackAudit, ({ one }) => ({
  order: one(orders, {
    fields: [pickPackAudit.orderId],
    references: [orders.id],
  }),
  orderItem: one(orderItems, {
    fields: [pickPackAudit.orderItemId],
    references: [orderItems.id],
  }),
  performedByUser: one(users, {
    fields: [pickPackAudit.performedBy],
    references: [users.id],
  }),
}));

export type PickPackAudit = typeof pickPackAudit.$inferSelect;
export type NewPickPackAudit = typeof pickPackAudit.$inferInsert;
