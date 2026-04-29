# NuraSkin WMS — Implementation Progress
> Update this file at the END of every coding session, before closing Claude or Gemini.
> This is your handoff document. Always paste this alongside CLAUDE.md and the Master Prompt.

---

## HOW TO START A NEW SESSION

Paste in this exact order:
```
1. CLAUDE.md
2. This file (PROGRESS.md)
3. NURASKIN_WMS_MASTER_PROMPT_v2.md
4. Say: "Read all three files. Then continue from: [YOUR TASK]"
```

---

## PHASE 1 — Database Foundation (Drizzle Schema + Migrations)
**Status: ✅ COMPLETE**

### Files created/modified:
- [x] `libs/database/src/schema/products.ts` — full schema replacing stub
- [x] `libs/database/src/schema/pricing.ts` — `product_regional_configs`
- [x] `libs/database/src/schema/inventory.ts` — `inventory_batches`, `stock_movements`, `stock_reservations`
- [x] `libs/database/src/schema/customers.ts` — `customers`
- [x] `libs/database/src/schema/orders.ts` — `orders`, `order_items`, `order_status_history`
- [x] `libs/database/src/schema/settings.ts` — `settings`, `exchange_rate_snapshots`
- [x] `libs/database/src/schema/audit.ts` — `pick_pack_audit`
- [x] `libs/database/src/schema/index.ts` — exports all schemas
- [x] `libs/database/src/schema/category-products.ts` — DELETED (replaced by direct FK on products)
- [x] `libs/database/src/schema/categories.ts` — removed categoryProducts relation
- [x] Migration `0003_warm_preak.sql` generated and applied
- [x] Seed file updated: one `settings` row + one `exchange_rate_snapshots` row

### Completion check:
- [x] `nx typecheck database` passes
- [x] Migration applied successfully
- [x] Seeds run without error

### Decisions made:
- `category_products` junction table dropped; products now have direct `category_id FK → categories`
- `stock_movements.order_id` and `stock_reservations.order_id/order_item_id` declared as plain uuid (no inline `.references()`) to avoid circular imports between inventory.ts and orders.ts — enforced at application layer
- `tsconfig.base.json` target bumped from `es2015` → `es2020` (needed for BigInt; matches Node 20 runtime)

---

## PHASE 2 — Products CRUD + AI Image Analyzer
**Status: ✅ COMPLETE**

### Server files created:
- [x] `apps/server/src/modules/products/products.repository.ts`
- [x] `apps/server/src/modules/products/products.service.ts`
- [x] `apps/server/src/modules/products/products.controller.ts`
- [x] `apps/server/src/modules/products/products.routes.ts`
- [x] `apps/server/src/modules/products/product-analyzer.service.ts`
- [x] `apps/server/src/modules/products/product-analyzer.service.spec.ts`

### Shared-types files:
- [x] `libs/shared-types/src/lib/products.ts` — `CreateProductSchema`, `UpdateProductSchema`, `AnalyzeImageSchema`
- [x] `libs/shared-types/src/index.ts` — updated exports

### Admin UI files created:
- [x] `apps/admin/src/app/products/ProductsListPage.tsx`
- [x] `apps/admin/src/app/products/ProductFormPage.tsx`
- [x] `apps/admin/src/app/products/components/AiFillButton.tsx`
- [x] `apps/admin/src/app/products/components/RegionalConfigTabs.tsx`
- [x] `apps/admin/src/app/products/components/ImageUpload.tsx`
- [x] `apps/admin/src/app/products/api/products.api.ts`
- [x] `apps/admin/src/routes/_app/products.tsx` — updated to use ProductsListPage

### Env vars:
- [x] `OPENAI_API_KEY` added to `env.ts` (required — crashes on boot if missing)
- [x] `openai` package installed in server app

### App.ts update:
- [x] Products router mounted at `/api/products`

### Completion check:
- [x] All typechecks pass (server, admin, database, shared-types)
- [x] `openai` package installed (not previously present)
- [x] New product fields added (`ingredients`, `skinTypes`, `benefits`, `howToUseUz`) across all layers
- [x] AI Image Analyzer updated to fill `benefits` and `howToUseUz`
- [x] Tag input UI implemented for array fields in Admin UI

---

## PHASE 3 — Warehouse In-Stocking + Barcode Scanner
**Status: ✅ COMPLETE**

### Install:
- [x] `@zxing/browser` and `@zxing/library` installed in admin app

### Library files to create:
- [x] `libs/ui/src/scanner/BarcodeScanner.tsx`
- [x] `libs/ui/src/scanner/index.ts`

### Server files to create:
- [x] `apps/server/src/modules/inventory/inventory.repository.ts`
- [x] `apps/server/src/modules/inventory/inventory.service.ts`
- [x] `apps/server/src/modules/inventory/inventory.service.spec.ts`
- [x] `apps/server/src/modules/inventory/inventory.controller.ts`
- [x] `apps/server/src/modules/inventory/inventory.routes.ts`

### Admin UI files to create:
- [x] `apps/admin/src/app/inventory/api/inventory.api.ts`
- [x] `apps/admin/src/app/inventory/ScanPage.tsx`
- [x] `apps/admin/src/app/inventory/InventoryOverviewPage.tsx`
- [x] `apps/admin/src/app/inventory/components/AddBatchSheet.tsx`

### Completion check:
- [x] `nx affected:typecheck` passes
- [x] `nx affected:test` passes
- [x] Scanner component implements vibration, torch, and manual fallback
- [x] Inventory overview shows total stock and low stock flags
- [x] FIFO logic implemented in repository and verified with unit tests

---

## PHASE 4 — Orders System, Payment Verification & Pick-Pack
**Status: ✅ COMPLETE**

### Server files created:
- [x] `apps/server/src/modules/orders/orders.repository.ts`
- [x] `apps/server/src/modules/orders/orders.service.ts`
- [x] `apps/server/src/modules/orders/orders.controller.ts`
- [x] `apps/server/src/modules/orders/orders.routes.ts`
- [x] `libs/shared-types/src/lib/orders.ts` — Zod schemas and response types

### Admin UI files created:
- [x] `apps/admin/src/app/orders/OrdersListPage.tsx`
- [x] `apps/admin/src/app/orders/OrderDetailPage.tsx`
- [x] `apps/admin/src/app/orders/components/PaymentVerificationCard.tsx`
- [x] `apps/admin/src/app/orders/components/OrderItemsTable.tsx`
- [x] `apps/admin/src/app/orders/components/PackingScanner.tsx`
- [x] `apps/admin/src/app/orders/components/OrderStatusBadge.tsx`

### Completion check:
- [x] `nx affected:typecheck` passes
- [x] Debt check blocks at 100%+ (implemented in service)
- [x] FIFO deduction confirmed in DB after packing (implemented in service)
- [x] Cancellation restores stock (unified shared logic across timeout, admin, and customer paths)
- [x] `pick_pack_audit` logs every scan action

---

## PHASE 5 — PDF Receipt Generation
**Status: ✅ COMPLETE**

### Install:
- [x] `pdfkit` installed in server app
- [x] `@types/pdfkit` installed as dev dependency
- [x] `date-fns` installed in server app

### Files created/modified:
- [x] `apps/server/src/modules/orders/receipts.service.ts` — PDF layout with order snapshots
- [x] `apps/server/src/modules/orders/orders.controller.ts` — `getReceipt` handler
- [x] `apps/server/src/modules/orders/orders.routes.ts` — `GET /:id/receipt` route
- [x] `apps/admin/src/app/orders/OrderDetailPage.tsx` — secure blob download for receipt

### Completion check:
- [x] `nx affected:typecheck` passes
- [x] PDF downloads correctly with correct data (manual test)

---

## PHASE 6 — Exchange Rates, Settings & Admin Card
**Status: ✅ COMPLETE**

### Files created/modified:
- [x] `apps/server/src/modules/settings/settings.service.ts`
- [x] `apps/server/src/modules/settings/settings.controller.ts`
- [x] `apps/server/src/modules/settings/settings.routes.ts`
- [x] `apps/server/src/modules/exchange-rates/exchange-rates.service.ts`
- [x] `apps/server/src/modules/exchange-rates/exchange-rates.controller.ts`
- [x] `apps/server/src/modules/exchange-rates/exchange-rates.routes.ts`
- [x] `apps/admin/src/app/settings/SettingsPage.tsx`
- [x] `apps/admin/src/app/settings/RatesPage.tsx`
- [x] `libs/shared-types/src/lib/settings.ts`
- [x] `libs/shared-types/src/lib/exchange-rates.ts`

### Completion check:
- [x] `nx affected:typecheck` passes
- [x] Active rate used correctly in order price calculation (manual test)

---

## DECISIONS MADE DURING CODING
- Added `@zxing/library` to `libs/ui` as a dependency to support `BarcodeScanner` types.
- Fixed `OpenAI` mocking in server tests by using a class-based mock to satisfy `new OpenAI()` constructor calls.
- Placed inventory admin pages in `apps/admin/src/app/inventory` and routes in `apps/admin/src/routes/_app/inventory/` to match project structure.
- Used `requireAuth` from `auth.middleware` for inventory routes.
- Implemented a reusable `TagInput` component using Shadcn `Badge` and `Input` for handling string array fields in product forms.
- Installed `date-fns` in `apps/admin` for date formatting in orders module.
- Created Shadcn `textarea` component in `apps/admin` as it was missing.
- Implemented secure PDF receipt download in `OrderDetailPage` by fetching as a blob with the `Authorization` header instead of using `window.open`, ensuring auth-protected endpoints work correctly.

---

## PHASE 7 — Storefront Connection & Region Selection
**Status: ✅ COMPLETE**

### Server files created:
- [x] `apps/server/src/modules/storefront/storefront.repository.ts`
- [x] `apps/server/src/modules/storefront/storefront.service.ts`
- [x] `apps/server/src/modules/storefront/storefront.controller.ts`
- [x] `apps/server/src/modules/storefront/storefront.routes.ts`
- [x] `libs/shared-types/src/lib/storefront.ts` — Storefront specific schemas

### Frontend files created/modified:
- [x] `apps/frontend/src/components/shared/RegionSelectionModal.tsx` — Mandatory region selection
- [x] `apps/frontend/src/stores/app.store.ts` — Persistent region state + cart clearing logic
- [x] `apps/frontend/src/lib/apiFetch.ts` — Automatic regional query injection + auth headers
- [x] `apps/frontend/src/api/products.ts`, `api/orders.ts`, `api/settings.ts` — Real API integration
- [x] `apps/frontend/src/routes/products/index.tsx` & `$slug.tsx` — Updated for server-side pricing
- [x] `apps/frontend/src/routes/_protected/checkout.tsx` & `orders.tsx` — Full end-to-end checkout flow

### Completion check:
- [x] Storefront server endpoints implemented and typechecked
- [x] Region selection modal blocks app on first visit
- [x] Switching region clears cart and refetches prices
- [x] Checkout uses server-side price calculation

---

## PHASE 8 — Telegram Notifications System
**Status: ✅ COMPLETE**

### Server files created:
- [x] `apps/server/src/modules/notifications/notification.service.ts` — Core notification logic

### Notifications integrated in:
- [x] `storefront.service.ts` (Order Placed, Receipt Submitted)
- [x] `orders.service.ts` (Payment Approved, Rejection, Shipped, Delivered)
- [x] `inventory.service.ts` (Low Stock Alert for Admin)

### Features:
- [x] Customer notifications for all status changes
- [x] Admin notifications for new orders and payments
- [x] Admin alerts for low inventory stock
- [x] Fail-safe implementation (notifications never crash main flow)

---

## PHASE 9 — Pricing Overhaul (KRW-only base)
**Status: ✅ COMPLETE**

### Major Changes:
- [x] **USD Removed:** USD has been completely removed as a base currency from database schemas, server logic, and all frontend UIs.
- [x] **KRW Base:** All products are now priced in KRW.
- [x] **New UZB Formula:** `(base_krw * rate) + (weight * cargo * rate)`, rounded to nearest 1,000 UZS.
- [x] **Per-item UZB Cargo:** Cargo fee is now calculated per product and included in the displayed price for Uzbekistan.
- [x] **Tiered KOR Shipping:** Implemented dynamic shipping tiers for Korea based on order total.

### Implementation Details:
- [x] **Database:** Migrated `exchange_rate_snapshots` to KRW-to-UZS rates. Added `min_order` thresholds to `settings`. Created `kor_shipping_tiers` table.
- [x] **Backend:** Created `pricing.ts` utilities for consistent server-side calculations. Updated `storefront` and `orders` services.
- [x] **Admin App:** Updated `RatesPage`, `SettingsPage`, and `ProductForm`. Created `ShippingTiersPage` for dynamic Korea logistics management.
- [x] Storefront: Added `formatUzs` and `formatKrw` helpers. Updated Product and Cart pages to reflect new cargo-inclusive pricing and tiered shipping.

---

## PHASE 10 — Stock Reservation & Payment Timeout
**Status: ✅ COMPLETE**

### Major Changes:
- [x] **Available Stock Logic:** Implemented `physical_stock - active_reservations` calculation to prevent over-ordering.
- [x] **Reservation with Expiry:** Stock is now reserved for 30 minutes (configurable) when order moves to `PENDING_PAYMENT`.
- [x] **Race Condition Prevention:** Implemented database transactions with row-level locking (`FOR UPDATE`) during order creation.
- [x] **Automated Cleanup:** Integrated BullMQ worker to automatically release expired reservations and cancel unpaid orders.
- [x] **Stock Visibility:** Added admin toggle to control whether exact stock counts are visible to customers.

### Implementation Details:
- [x] **Database:** Added `show_stock_count` (products), `payment_timeout_minutes` (settings), and `expires_at` (stock_reservations).
- [x] **Server:** Created `reservation-timeout` queue and worker. Updated `storefront` and `orders` services.
- [x] **Admin App:** Added "Show stock count" toggle in product form and "Payment timeout" in settings. Added expiration countdown timer in order details.
- [x] Storefront: Implemented tiered stock badges and client-side cart validation against `availableStock`.
- [x] Notifications: Added customer and admin alerts for payment timeouts.

---

## PHASE 11 — Database-backed Cart
**Status: ✅ COMPLETE**

### Major Changes:
- [x] **Persistence:** Moved cart data from `localStorage` to PostgreSQL. Cart now syncs across devices.
- [x] **Server-side Validation:** Cart quantity is now validated against `availableStock` on every add/update.
- [x] **Regional Pricing:** Cart automatically applies wholesale discounts based on quantity and regional config.
- [x] **Order Integration:** Cart is automatically cleared upon successful order placement.

### Implementation Details:
- [x] **Database:** Created `carts` and `cart_items` tables with cascaded deletions.
- [x] **Server:** Built a new `carts` module with full CRUD and inventory integration.
- [x] Frontend: Refactored entire cart flow to use TanStack Query mutations and queries. Updated Navbar, Cart, and Checkout pages.

---

## PHASE 12 — Out-of-stock Waitlist
**Status: ✅ COMPLETE**

...

## PHASE 13 — Batch CRUD & Inventory Adjustments
**Status: ✅ COMPLETE**

### Major Changes:
- [x] **Audit Trail:** Added `batch_adjustments` table to track every manual change to inventory batches (who, when, what, why).
- [x] **Batch Management:** Implemented full CRUD for inventory batches on the product detail page.
- [x] **Quantity Adjustments:** Added ability to manually adjust stock levels with mandatory reason logging.
- [x] **Validation Rules:** Strict enforcement of business rules (e.g., cannot change initial quantity if stock was already sold, cannot delete used batches).

### Implementation Details:
- [x] **Database:** Added `batch_adjustments` table. Updated `stock_movements` types to include `ADJUSTMENT_IN` and `ADJUSTMENT_OUT`.
- [x] **Backend:** Added endpoints for PATCH, POST adjust-quantity, and DELETE batches. Implemented transaction-safe logic in service and repository.
- [x] **Admin App:** Added `EditBatchSheet`, `AdjustQuantityDialog`, and action menus in `InventoryDetailPage`. Added `Alert` UI component.

---

## KNOWN ISSUES / BUGS
> Add any bugs found but not yet fixed.

_(empty — fill as you go)_
