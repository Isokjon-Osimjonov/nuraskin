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
**Status: ⬜ NOT STARTED**

### Files to create:
- [ ] `libs/database/src/schema/products.ts`
- [ ] `libs/database/src/schema/pricing.ts`
- [ ] `libs/database/src/schema/inventory.ts`
- [ ] `libs/database/src/schema/customers.ts`
- [ ] `libs/database/src/schema/orders.ts`
- [ ] `libs/database/src/schema/settings.ts`
- [ ] `libs/database/src/schema/audit.ts`
- [ ] `libs/database/src/schema/index.ts` (exports all)
- [ ] Migration file generated and applied
- [ ] Seed file: one `settings` row + one `exchange_rate_snapshots` row

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] Migration applied successfully
- [ ] Seeds run without error

---

## PHASE 2 — Products CRUD + AI Image Analyzer
**Status: ⬜ NOT STARTED**

### Server files to create:
- [ ] `apps/server/src/products/products.repository.ts`
- [ ] `apps/server/src/products/products.service.ts`
- [ ] `apps/server/src/products/products.service.spec.ts`
- [ ] `apps/server/src/products/products.controller.ts`
- [ ] `apps/server/src/products/products.routes.ts`
- [ ] `apps/server/src/products/product-analyzer.service.ts`
- [ ] `apps/server/src/products/product-analyzer.service.spec.ts`
- [ ] `libs/types/src/schemas/product.schema.ts`

### Admin UI files to create:
- [ ] `apps/admin/src/pages/products/ProductsListPage.tsx`
- [ ] `apps/admin/src/pages/products/ProductFormPage.tsx`
- [ ] `apps/admin/src/pages/products/components/AiFillButton.tsx`
- [ ] `apps/admin/src/pages/products/components/RegionalConfigTabs.tsx`

### Env vars added:
- [ ] `OPENAI_API_KEY` added to `.env` and Zod env validator

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] `nx affected:test` passes

---

## PHASE 3 — Warehouse In-Stocking + Barcode Scanner
**Status: ⬜ NOT STARTED**

### Install:
- [ ] `@zxing/browser` and `@zxing/library` installed in admin app

### Library files to create:
- [ ] `libs/ui/src/scanner/BarcodeScanner.tsx`
- [ ] `libs/ui/src/scanner/index.ts`

### Server files to create:
- [ ] `apps/server/src/inventory/inventory.repository.ts`
- [ ] `apps/server/src/inventory/inventory.service.ts`
- [ ] `apps/server/src/inventory/inventory.service.spec.ts`
- [ ] `apps/server/src/inventory/inventory.controller.ts`
- [ ] `apps/server/src/inventory/inventory.routes.ts`

### Admin UI files to create:
- [ ] `apps/admin/src/pages/inventory/ScanPage.tsx`
- [ ] `apps/admin/src/pages/inventory/InventoryOverviewPage.tsx`
- [ ] `apps/admin/src/pages/inventory/components/AddBatchSheet.tsx`
- [ ] `apps/admin/src/pages/inventory/components/ProductStockCard.tsx`

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] `nx affected:test` passes
- [ ] Scanner opens camera on mobile browser (manual test)
- [ ] Vibration fires on successful scan (manual test)

---

## PHASE 4 — Orders System, Payment Verification & Pick-Pack
**Status: ⬜ NOT STARTED**

### Server files to create:
- [ ] `apps/server/src/orders/orders.repository.ts`
- [ ] `apps/server/src/orders/orders.service.ts`
- [ ] `apps/server/src/orders/orders.service.spec.ts`
- [ ] `apps/server/src/orders/orders.controller.ts`
- [ ] `apps/server/src/orders/orders.routes.ts`
- [ ] `libs/types/src/schemas/order.schema.ts`

### Admin UI files to create:
- [ ] `apps/admin/src/pages/orders/OrdersListPage.tsx`
- [ ] `apps/admin/src/pages/orders/OrderDetailPage.tsx`
- [ ] `apps/admin/src/pages/orders/components/PaymentVerificationCard.tsx`
- [ ] `apps/admin/src/pages/orders/components/OrderItemsTable.tsx`
- [ ] `apps/admin/src/pages/orders/components/PackingScanner.tsx`
- [ ] `apps/admin/src/pages/orders/components/OrderStatusBadge.tsx`

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] `nx affected:test` passes
- [ ] Debt check blocks at 100%+ (manual test)
- [ ] FIFO deduction confirmed in DB after packing (manual test)
- [ ] Cancellation restores stock (manual test)

---

## PHASE 5 — PDF Receipt Generation
**Status: ⬜ NOT STARTED**

### Install:
- [ ] `pdfkit` installed in server app
- [ ] `@types/pdfkit` installed as dev dependency

### Files to create:
- [ ] `apps/server/src/receipts/receipt.service.ts`
- [ ] `apps/server/src/receipts/receipt.routes.ts`
- [ ] Admin: "Chek yuklab olish" button added to OrderDetailPage

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] PDF downloads correctly with correct data (manual test)

---

## PHASE 6 — Exchange Rates, Settings & Admin Card
**Status: ⬜ NOT STARTED**

### Files to create:
- [ ] `apps/server/src/settings/settings.service.ts`
- [ ] `apps/server/src/settings/settings.controller.ts`
- [ ] `apps/server/src/settings/settings.routes.ts`
- [ ] `apps/server/src/rates/rates.service.ts`
- [ ] `apps/server/src/rates/rates.controller.ts`
- [ ] `apps/server/src/rates/rates.routes.ts`
- [ ] `apps/admin/src/pages/settings/SettingsPage.tsx`
- [ ] `apps/admin/src/pages/settings/RatesPage.tsx`

### Completion check:
- [ ] `nx affected:typecheck` passes
- [ ] Active rate used correctly in order price calculation (manual test)

---

## DECISIONS MADE DURING CODING
> Add any deviation from the master prompt here so future sessions know.

_(empty — fill as you go)_

---

## KNOWN ISSUES / BUGS
> Add any bugs found but not yet fixed.

_(empty — fill as you go)_
