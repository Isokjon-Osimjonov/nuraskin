# NuraSkin Database Schema Reference

## Tables Overview

| Table Name               | Row Count |
| ------------------------ | --------- |
| batch_adjustments        | 0         |
| cart_items               | 1         |
| carts                    | 1         |
| categories               | 1         |
| coupon_redemptions       | 7         |
| coupons                  | 5         |
| customer_addresses       | 1         |
| customers                | 4         |
| daily_sales_summary      | 5         |
| exchange_rate_snapshots  | 5         |
| expenses                 | 0         |
| health_checks            | 2         |
| inventory_batches        | 2         |
| kor_shipping_tiers       | 4         |
| order_expenses           | 0         |
| order_items              | 23        |
| order_status_history     | 65        |
| orders                   | 25        |
| pick_pack_audit          | 0         |
| product_regional_configs | 2         |
| product_waitlist         | 0         |
| products                 | 1         |
| settings                 | 1         |
| stock_movements          | 4         |
| stock_reservations       | 23        |
| telegram_channels        | 0         |
| telegram_post_channels   | 0         |
| telegram_posts           | 0         |
| telegram_users           | 1         |
| users                    | 2         |

## Enums

The project primarily uses CHECK constraints instead of native PostgreSQL ENUM types.

### Defined Constraints (Partial List):

- **User Roles:** `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE`, `VIEWER`
- **Order Status:** `DRAFT`, `PENDING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_CONFIRMED`, `PAYMENT_REJECTED`, `PACKING`, `SHIPPED`, `DELIVERED`, `CANCELED`, `REFUNDED`
- **Order Source:** `STOREFRONT`, `MANUAL`
- **Payment Method:** `TELEGRAM_TRANSFER`, `CASH`, `BANK_TRANSFER`, `CARD`
- **Delivery Covered By:** `CUSTOMER`, `BUSINESS`
- **Coupon Status:** `DRAFT`, `ACTIVE`, `PAUSED`, `EXPIRED`, `ARCHIVED`
- **Stock Movement Type:** `STOCK_IN`, `RESERVED`, `RESERVATION_RELEASED`, `DEDUCTED`, `ADJUSTED`, `RETURNED`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`

## Entity Relationships (Foreign Keys)

| Table Name               | Column Name          | Foreign Table           | Foreign Column |
| ------------------------ | -------------------- | ----------------------- | -------------- |
| batch_adjustments        | batch_id             | inventory_batches       | id             |
| batch_adjustments        | admin_id             | users                   | id             |
| cart_items               | product_id           | products                | id             |
| cart_items               | cart_id              | carts                   | id             |
| carts                    | customer_id          | customers               | id             |
| coupon_redemptions       | coupon_id            | coupons                 | id             |
| coupon_redemptions       | customer_id          | customers               | id             |
| customer_addresses       | customer_id          | customers               | id             |
| daily_sales_summary      | product_id           | products                | id             |
| exchange_rate_snapshots  | created_by           | users                   | id             |
| expenses                 | created_by           | users                   | id             |
| inventory_batches        | product_id           | products                | id             |
| order_expenses           | order_id             | orders                  | id             |
| order_expenses           | created_by           | users                   | id             |
| order_items              | order_id             | orders                  | id             |
| order_items              | scanned_by           | users                   | id             |
| order_items              | product_id           | products                | id             |
| order_items              | batch_id             | inventory_batches       | id             |
| order_status_history     | order_id             | orders                  | id             |
| order_status_history     | changed_by           | users                   | id             |
| orders                   | payment_verified_by  | users                   | id             |
| orders                   | rate_snapshot_id     | exchange_rate_snapshots | id             |
| orders                   | customer_id          | customers               | id             |
| orders                   | packed_by            | users                   | id             |
| orders                   | payment_confirmed_by | users                   | id             |
| orders                   | created_by           | users                   | id             |
| pick_pack_audit          | performed_by         | users                   | id             |
| pick_pack_audit          | order_id             | orders                  | id             |
| pick_pack_audit          | order_item_id        | order_items             | id             |
| product_regional_configs | product_id           | products                | id             |
| product_waitlist         | product_id           | products                | id             |
| product_waitlist         | customer_id          | customers               | id             |
| products                 | category_id          | categories              | id             |
| stock_movements          | batch_id             | inventory_batches       | id             |
| stock_movements          | product_id           | products                | id             |
| stock_movements          | performed_by         | users                   | id             |
| stock_reservations       | product_id           | products                | id             |
| stock_reservations       | batch_id             | inventory_batches       | id             |
| telegram_channels        | added_by             | users                   | id             |
| telegram_post_channels   | channel_id           | telegram_channels       | id             |
| telegram_post_channels   | post_id              | telegram_posts          | id             |
| telegram_posts           | created_by           | users                   | id             |
| telegram_posts           | product_id           | products                | id             |

## Drizzle Schema Files

### libs/database/src/schema/audit.ts

```typescript
import { pgTable, uuid, varchar, text, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { orders, orderItems } from './orders';
import { users } from './users';

// APPEND-ONLY — no UPDATE or DELETE ever
export const pickPackAudit = pgTable(
  'pick_pack_audit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    action: varchar('action', { length: 30 }).notNull(),
    scanInput: varchar('scan_input', { length: 100 }),
    expectedBarcode: varchar('expected_barcode', { length: 50 }),
    result: varchar('result', { length: 10 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('pick_pack_audit_order_id_idx').on(t.orderId),
    orderItemIdIdx: index('pick_pack_audit_order_item_id_idx').on(t.orderItemId),
    performedByIdx: index('pick_pack_audit_performed_by_idx').on(t.performedBy),
    createdAtIdx: index('pick_pack_audit_created_at_idx').on(t.createdAt),
    actionCheck: check(
      'pick_pack_audit_action_check',
      sql`${t.action} IN ('SCAN_SUCCESS', 'SCAN_MISMATCH', 'MANUAL_FALLBACK', 'ITEM_CONFIRMED', 'ORDER_PACKED')`
    ),
    resultCheck: check('pick_pack_audit_result_check', sql`${t.result} IN ('OK', 'ERROR')`),
  })
);

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
```

### libs/database/src/schema/carts.ts

```typescript
import { pgTable, uuid, integer, timestamp, uniqueIndex, text, bigint } from 'drizzle-orm/pg-core';
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

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    priceSnapshot: bigint('price_snapshot', { mode: 'bigint' })
      .notNull()
      .default(sql`'0'`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    cartProductUniq: uniqueIndex('cart_items_cart_product_idx').on(t.cartId, t.productId),
  })
);

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
```

### libs/database/src/schema/categories.ts

```typescript
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  t => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(t.slug),
    activeIdx: index('categories_active_idx').on(t.isActive),
    deletedIdx: index('categories_deleted_idx').on(t.deletedAt),
  })
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

### libs/database/src/schema/coupons.ts

```typescript
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
export const couponTypeEnum = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'] as const;
export const couponScopeEnum = ['ENTIRE_ORDER', 'PRODUCTS', 'CATEGORIES', 'BRANDS'] as const;

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),

    type: varchar('type', { length: 20 }).notNull().default('PERCENTAGE'), // PERCENTAGE, FIXED, FREE_SHIPPING
    value: bigint('value', { mode: 'bigint' }).notNull(), // % value or fixed amount in tiyin
    valueUzs: bigint('value_uzs', { mode: 'bigint' }), // tiyin for UZB orders
    valueKrw: bigint('value_krw', { mode: 'bigint' }), // won for KOR orders

    maxDiscountCap: bigint('max_discount_cap', { mode: 'bigint' }), // for percentage coupons
    maxDiscountUzs: bigint('max_discount_uzs', { mode: 'bigint' }),
    maxDiscountKrw: bigint('max_discount_krw', { mode: 'bigint' }),

    scope: varchar('scope', { length: 20 }).notNull().default('ENTIRE_ORDER'), // ENTIRE_ORDER, PRODUCTS, CATEGORIES, BRANDS
    applicableResourceIds: uuid('applicable_resource_ids').array(), // list of product/category IDs
    applicableBrands: varchar('applicable_brands', { length: 100 }).array(), // list of brand names

    minOrderAmount: bigint('min_order_amount', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    minOrderUzs: bigint('min_order_uzs', { mode: 'bigint' }).default(sql`0`),
    minOrderKrw: bigint('min_order_krw', { mode: 'bigint' }).default(sql`0`),

    minOrderQty: integer('min_order_qty').notNull().default(1),

    regionCode: varchar('region_code', { length: 3 }), // UZB, KOR or null for all

    firstOrderOnly: boolean('first_order_only').notNull().default(false),
    onePerCustomer: boolean('one_per_customer').notNull().default(false),
    excludeWholesale: boolean('exclude_wholesale').notNull().default(false),

    targetCustomerIds: uuid('target_customer_ids').array(), // null = all

    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    maxUsesTotal: integer('max_uses_total'),
    maxUsesPerCustomer: integer('max_uses_per_customer').notNull().default(1),
    usageCount: integer('usage_count').notNull().default(0),

    autoApply: boolean('auto_apply').notNull().default(false),
    isStackable: boolean('is_stackable').notNull().default(false),

    isPromotional: boolean('is_promotional').notNull().default(false),
    isFirstPurchaseOnly: boolean('is_first_purchase_only').notNull().default(false),
    promoDisplayText: text('promo_display_text'),

    status: varchar('status', { length: 20 }).notNull().default('DRAFT'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  t => ({
    codeIdx: index('coupons_code_idx').on(t.code),
    statusIdx: index('coupons_status_idx').on(t.status),
    statusCheck: check(
      'coupons_status_check',
      sql`${t.status} IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')`
    ),
    typeCheck: check(
      'coupons_type_check',
      sql`${t.type} IN ('PERCENTAGE', 'FIXED', 'FREE_SHIPPING')`
    ),
    scopeCheck: check(
      'coupons_scope_check',
      sql`${t.scope} IN ('ENTIRE_ORDER', 'PRODUCTS', 'CATEGORIES', 'BRANDS')`
    ),
  })
);

// APPEND-ONLY — no UPDATE or DELETE ever
export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    orderId: uuid('order_id').notNull(), // FK enforced at application layer to avoid circular deps
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    couponIdIdx: index('coupon_redemptions_coupon_id_idx').on(t.couponId),
    customerIdIdx: index('coupon_redemptions_customer_id_idx').on(t.customerId),
    orderIdIdx: index('coupon_redemptions_order_id_idx').on(t.orderId),
  })
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type NewCouponRedemption = typeof couponRedemptions.$inferInsert;
```

### libs/database/src/schema/customer-addresses.ts

```typescript
import { pgTable, uuid, text, boolean, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { customers } from './customers';

export const customerAddresses = pgTable(
  'customer_addresses',
  {
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
  },
  t => ({
    customerIdIdx: index('idx_customer_addresses_customer_id').on(t.customerId),
    regionCodeCheck: check(
      'customer_addresses_region_code_check',
      sql`${t.regionCode} IN ('UZB', 'KOR')`
    ),
  })
);

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
```

### libs/database/src/schema/customers.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  bigint,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customerAddresses } from './customer-addresses';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    telegramId: bigint('telegram_id', { mode: 'bigint' }).unique(),
    phone: varchar('phone', { length: 20 }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    regionCode: varchar('region_code', { length: 5 }).notNull().default('UZB'),
    debtLimitOverride: bigint('debt_limit_override', { mode: 'bigint' }),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    telegramIdIdx: uniqueIndex('customers_telegram_id_idx').on(t.telegramId),
    phoneIdx: index('customers_phone_idx').on(t.phone),
    regionCodeIdx: index('customers_region_code_idx').on(t.regionCode),
    isActiveIdx: index('customers_is_active_idx').on(t.isActive),
  })
);

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
```

### libs/database/src/schema/daily-sales.ts

```typescript
import { pgTable, uuid, text, bigint, date, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { products } from './products';
import { relations, sql } from 'drizzle-orm';

export const dailySalesSummary = pgTable(
  'daily_sales_summary',
  {
    date: date('date').notNull(),
    regionCode: text('region_code').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    unitsSold: integer('units_sold').notNull().default(0),
    revenueKrw: bigint('revenue_krw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    cogsKrw: bigint('cogs_krw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    cargoKrw: bigint('cargo_krw', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    orderCount: integer('order_count').notNull().default(0),
  },
  t => ({
    pk: primaryKey({ columns: [t.date, t.regionCode, t.productId] }),
    dateIdx: index('idx_daily_sales_date').on(t.date),
    regionIdx: index('idx_daily_sales_region').on(t.regionCode),
  })
);

export const dailySalesSummaryRelations = relations(dailySalesSummary, ({ one }) => ({
  product: one(products, {
    fields: [dailySalesSummary.productId],
    references: [products.id],
  }),
}));

export type DailySalesSummary = typeof dailySalesSummary.$inferSelect;
export type NewDailySalesSummary = typeof dailySalesSummary.$inferInsert;
```

### libs/database/src/schema/expenses.ts

```typescript
import { pgTable, uuid, text, bigint, date, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: text('category').notNull(),
    amountKrw: bigint('amount_krw', { mode: 'bigint' }).notNull(),
    description: text('description').notNull(),
    expenseDate: date('expense_date').notNull(),
    receiptUrl: text('receipt_url'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    expenseDateIdx: index('idx_expenses_expense_date').on(t.expenseDate),
    categoryIdx: index('idx_expenses_category').on(t.category),
  })
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
```

### libs/database/src/schema/inventory.ts

```typescript
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

export const inventoryBatches = pgTable(
  'inventory_batches',
  {
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
  },
  t => ({
    productIdIdx: index('inventory_batches_product_id_idx').on(t.productId),
    receivedAtIdx: index('inventory_batches_received_at_idx').on(t.receivedAt),
    expiryDateIdx: index('inventory_batches_expiry_date_idx').on(t.expiryDate),
    initialQtyCheck: check('inventory_batches_initial_qty_check', sql`${t.initialQty} > 0`),
    currentQtyCheck: check('inventory_batches_current_qty_check', sql`${t.currentQty} >= 0`),
  })
);

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one }) => ({
  product: one(products, {
    fields: [inventoryBatches.productId],
    references: [products.id],
  }),
}));

// APPEND-ONLY — no UPDATE or DELETE ever
// orderId has no inline .references() to avoid circular import with orders.ts
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => inventoryBatches.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    orderId: uuid('order_id'), // FK → orders(id), enforced at application layer
    movementType: varchar('movement_type', { length: 25 }).notNull(),
    quantityDelta: integer('quantity_delta').notNull(),
    qtyBefore: integer('qty_before').notNull(),
    qtyAfter: integer('qty_after').notNull(),
    performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    productIdIdx: index('stock_movements_product_id_idx').on(t.productId),
    batchIdIdx: index('stock_movements_batch_id_idx').on(t.batchId),
    orderIdIdx: index('stock_movements_order_id_idx').on(t.orderId),
    movementTypeIdx: index('stock_movements_movement_type_idx').on(t.movementType),
    createdAtIdx: index('stock_movements_created_at_idx').on(t.createdAt),
    movementTypeCheck: check(
      'stock_movements_type_check',
      sql`${t.movementType} IN ('STOCK_IN', 'RESERVED', 'RESERVATION_RELEASED', 'DEDUCTED', 'ADJUSTED', 'RETURNED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')`
    ),
  })
);

// orderId and orderItemId have no inline .references() to avoid circular import
export const stockReservations = pgTable(
  'stock_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull(), // FK → orders(id), enforced at application layer
    customerId: uuid('customer_id'), // FK → customers(id), enforced at application layer
    orderItemId: uuid('order_item_id').notNull(), // FK → order_items(id), enforced at application layer
    batchId: uuid('batch_id')
      .notNull()
      .references(() => inventoryBatches.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('stock_reservations_order_id_idx').on(t.orderId),
    orderItemIdIdx: index('stock_reservations_order_item_id_idx').on(t.orderItemId),
    batchIdIdx: index('stock_reservations_batch_id_idx').on(t.batchId),
    productIdIdx: index('stock_reservations_product_id_idx').on(t.productId),
    statusCheck: check(
      'stock_reservations_status_check',
      sql`${t.status} IN ('ACTIVE', 'RELEASED', 'CONVERTED')`
    ),
  })
);

export const batchAdjustments = pgTable(
  'batch_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => inventoryBatches.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id').references(() => users.id, { onDelete: 'set null' }),
    fieldChanged: text('field_changed').notNull(),
    oldValue: text('old_value').notNull(),
    newValue: text('new_value').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    batchIdIdx: index('idx_batch_adj_batch_id').on(t.batchId),
  })
);

export type InventoryBatch = typeof inventoryBatches.$inferSelect;
export type NewInventoryBatch = typeof inventoryBatches.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type StockReservation = typeof stockReservations.$inferSelect;
export type NewStockReservation = typeof stockReservations.$inferInsert;
export type BatchAdjustment = typeof batchAdjustments.$inferSelect;
export type NewBatchAdjustment = typeof batchAdjustments.$inferInsert;
```

### libs/database/src/schema/orders.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  boolean,
  text,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { customers } from './customers';
import { products } from './products';
import { users } from './users';
import { exchangeRateSnapshots } from './settings';
import { inventoryBatches } from './inventory';

const bigintZero: SQL = sql`0`;

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    regionCode: varchar('region_code', { length: 5 }).notNull(),
    status: varchar('status', { length: 25 }).notNull().default('DRAFT'),
    subtotal: bigint('subtotal', { mode: 'bigint' }).notNull().default(bigintZero),
    cargoFee: bigint('cargo_fee', { mode: 'bigint' }).notNull().default(bigintZero),
    cargoCostKrw: bigint('cargo_cost_krw', { mode: 'bigint' }).notNull().default(bigintZero),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull().default(bigintZero),
    currency: varchar('currency', { length: 3 }).notNull(),
    totalWeightGrams: integer('total_weight_grams').notNull().default(0),
    couponId: uuid('coupon_id'),
    couponCode: varchar('coupon_code', { length: 50 }),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull().default(bigintZero),
    rateSnapshotId: uuid('rate_snapshot_id').references(() => exchangeRateSnapshots.id, {
      onDelete: 'set null',
    }),
    paymentReceiptUrl: text('payment_receipt_url'),
    paymentSubmittedAt: timestamp('payment_submitted_at', { withTimezone: true }),
    paymentVerifiedAt: timestamp('payment_verified_at', { withTimezone: true }),
    paymentVerifiedBy: uuid('payment_verified_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    paymentRejectedAt: timestamp('payment_rejected_at', { withTimezone: true }),
    paymentNote: text('payment_note'),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    packedBy: uuid('packed_by').references(() => users.id, { onDelete: 'set null' }),
    packedAt: timestamp('packed_at', { withTimezone: true }),
    adminNote: text('admin_note'),
    // Delivery address snapshot
    deliveryFullName: text('delivery_full_name'),
    deliveryPhone: text('delivery_phone'),
    deliveryAddressLine1: text('delivery_address_line1'),
    deliveryAddressLine2: text('delivery_address_line2'),
    deliveryCity: text('delivery_city'),
    deliveryPostalCode: text('delivery_postal_code'),
    deliveryRegionCode: text('delivery_region_code'),
    // Manual order fields
    orderSource: varchar('order_source', { length: 20 }).notNull().default('STOREFRONT'),
    paymentAmount: bigint('payment_amount', { mode: 'bigint' }),
    paymentMethod: varchar('payment_method', { length: 50 }),
    paymentReference: text('payment_reference'),
    paymentConfirmedBy: uuid('payment_confirmed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    paymentConfirmedAt: timestamp('payment_confirmed_at', { withTimezone: true }),
    deliveryFeeCharged: bigint('delivery_fee_charged', { mode: 'bigint' })
      .notNull()
      .default(bigintZero),
    deliveryFeeActual: bigint('delivery_fee_actual', { mode: 'bigint' }),
    deliveryCoveredBy: varchar('delivery_covered_by', { length: 20 }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderNumberIdx: uniqueIndex('orders_order_number_idx').on(t.orderNumber),
    customerIdIdx: index('orders_customer_id_idx').on(t.customerId),
    statusIdx: index('orders_status_idx').on(t.status),
    createdAtIdx: index('orders_created_at_idx').on(t.createdAt),
    statusCheck: check(
      'orders_status_check',
      sql`${t.status} IN ('DRAFT', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED')`
    ),
    sourceCheck: check('orders_source_check', sql`${t.orderSource} IN ('STOREFRONT', 'MANUAL')`),
    payMethodCheck: check(
      'orders_payment_method_check',
      sql`${t.paymentMethod} IN ('TELEGRAM_TRANSFER', 'CASH', 'BANK_TRANSFER', 'CARD')`
    ),
    deliveryCoveredCheck: check(
      'orders_delivery_covered_check',
      sql`${t.deliveryCoveredBy} IN ('CUSTOMER', 'BUSINESS')`
    ),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    batchId: uuid('batch_id').references(() => inventoryBatches.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull(),
    costAtSaleKrw: bigint('cost_at_sale_krw', { mode: 'bigint' }),
    unitPriceSnapshot: bigint('unit_price_snapshot', { mode: 'bigint' }).notNull(),
    negotiatedPriceKrw: bigint('negotiated_price_krw', { mode: 'bigint' }),
    subtotalSnapshot: bigint('subtotal_snapshot', { mode: 'bigint' }).notNull(),
    cargoFeeSnapshot: bigint('cargo_fee_snapshot', { mode: 'bigint' })
      .notNull()
      .default(bigintZero),
    currencySnapshot: varchar('currency_snapshot', { length: 3 }).notNull(),
    isScanned: boolean('is_scanned').notNull().default(false),
    scannedAt: timestamp('scanned_at', { withTimezone: true }),
    scannedBy: uuid('scanned_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('order_items_order_id_idx').on(t.orderId),
    productIdIdx: index('order_items_product_id_idx').on(t.productId),
    batchIdIdx: index('order_items_batch_id_idx').on(t.batchId),
    quantityCheck: check('order_items_quantity_check', sql`${t.quantity} > 0`),
  })
);

// APPEND-ONLY — no UPDATE or DELETE ever
export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    fromStatus: varchar('from_status', { length: 25 }),
    toStatus: varchar('to_status', { length: 25 }).notNull(),
    changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('order_status_history_order_id_idx').on(t.orderId),
    createdAtIdx: index('order_status_history_created_at_idx').on(t.createdAt),
  })
);

export const orderExpenses = pgTable(
  'order_expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    amountKrw: bigint('amount_krw', { mode: 'bigint' }).notNull(),
    note: text('note'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    isAuto: boolean('is_auto').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    orderIdIdx: index('idx_order_expenses_order_id').on(t.orderId),
    createdAtIdx: index('idx_order_expenses_created_at').on(t.createdAt),
  })
);

import { coupons } from './coupons';

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  rateSnapshot: one(exchangeRateSnapshots, {
    fields: [orders.rateSnapshotId],
    references: [exchangeRateSnapshots.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  expenses: many(orderExpenses),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  batch: one(inventoryBatches, {
    fields: [orderItems.batchId],
    references: [inventoryBatches.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

export const orderExpensesRelations = relations(orderExpenses, ({ one }) => ({
  order: one(orders, {
    fields: [orderExpenses.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [orderExpenses.createdBy],
    references: [users.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
```

### libs/database/src/schema/pricing.ts

```typescript
import {
  pgTable,
  uuid,
  bigint,
  integer,
  boolean,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { products } from './products';

export const productRegionalConfigs = pgTable(
  'product_regional_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    regionCode: varchar('region_code', { length: 5 }).notNull(),
    retailPrice: bigint('retail_price', { mode: 'bigint' }).notNull(),
    wholesalePrice: bigint('wholesale_price', { mode: 'bigint' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('KRW'),
    minWholesaleQty: integer('min_wholesale_qty').notNull().default(5),
    minOrderQty: integer('min_order_qty').notNull().default(1),
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    productRegionUniq: uniqueIndex('product_regional_configs_product_region_idx').on(
      t.productId,
      t.regionCode
    ),
    productIdIdx: index('product_regional_configs_product_id_idx').on(t.productId),
    regionCodeCheck: check(
      'product_regional_configs_region_check',
      sql`${t.regionCode} IN ('UZB', 'KOR')`
    ),
    currencyCheck: check(
      'product_regional_configs_currency_check',
      sql`${t.currency} IN ('UZS', 'KRW')`
    ),
  })
);

export const productRegionalConfigsRelations = relations(productRegionalConfigs, ({ one }) => ({
  product: one(products, {
    fields: [productRegionalConfigs.productId],
    references: [products.id],
  }),
}));

export type ProductRegionalConfig = typeof productRegionalConfigs.$inferSelect;
export type NewProductRegionalConfig = typeof productRegionalConfigs.$inferInsert;
```

### libs/database/src/schema/products.ts

```typescript
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

export const products = pgTable(
  'products',
  {
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
    showStockCount: boolean('show_stock_count').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    barcodeIdx: index('products_barcode_idx').on(t.barcode),
    skuIdx: index('products_sku_idx').on(t.sku),
    brandNameIdx: index('products_brand_name_idx').on(t.brandName),
    categoryIdIdx: index('products_category_id_idx').on(t.categoryId),
    deletedAtIdx: index('products_deleted_at_idx').on(t.deletedAt),
  })
);

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

### libs/database/src/schema/settings.ts

```typescript
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
  minOrderUzbUzs: bigint('min_order_uzb_uzs', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),
  minOrderKorKrw: bigint('min_order_kor_krw', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),
  freeShippingThresholdKrw: bigint('free_shipping_threshold_krw', { mode: 'bigint' })
    .notNull()
    .default(sql`200000`),
  standardShippingFeeKrw: bigint('standard_shipping_fee_krw', { mode: 'bigint' })
    .notNull()
    .default(sql`3000`),
  paymentTimeoutMinutes: integer('payment_timeout_minutes').notNull().default(30),
  telegramUrl: varchar('telegram_url', { length: 200 }),
  instagramUrl: varchar('instagram_url', { length: 200 }),
  websiteUrl: varchar('website_url', { length: 200 }),

  // Korean payment methods
  korBankEnabled: boolean('kor_bank_enabled').notNull().default(false),
  korBankName: text('kor_bank_name'),
  korBankHolder: text('kor_bank_holder'),
  korBankNumber: text('kor_bank_number'),

  korE9payEnabled: boolean('kor_e9pay_enabled').notNull().default(false),
  korE9payName: text('kor_e9pay_name'),
  korE9payAccount: text('kor_e9pay_account'),

  // Uzbek payment methods
  uzbBankEnabled: boolean('uzb_bank_enabled').notNull().default(false),
  uzbBankName: text('uzb_bank_name'),
  uzbBankHolder: text('uzb_bank_holder'),
  uzbBankNumber: text('uzb_bank_number'),

  uzbE9payEnabled: boolean('uzb_e9pay_enabled').notNull().default(false),
  uzbE9payName: text('uzb_e9pay_name'),
  uzbE9payAccount: text('uzb_e9pay_account'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exchangeRateSnapshots = pgTable(
  'exchange_rate_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    krwToUzs: integer('krw_to_uzs').notNull(),
    cargoRateKrwPerKg: integer('cargo_rate_krw_per_kg').notNull(),
    note: text('note'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    createdByIdx: index('exchange_rate_snapshots_created_by_idx').on(t.createdBy),
    createdAtIdx: index('exchange_rate_snapshots_created_at_idx').on(t.createdAt),
  })
);

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
```

### libs/database/src/schema/users.ts

```typescript
import { pgTable, uuid, text, timestamp, boolean, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull().default(''),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('ADMIN'),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => ({
    emailIdx: index('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.role),
    roleCheck: check(
      'users_role_check',
      sql`${t.role} IN ('SUPER_ADMIN', 'ADMIN', 'WAREHOUSE', 'VIEWER')`
    ),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```
