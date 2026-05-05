# NuraSkin — Remaining Issues Fix (Session 2)

> Previous session completed: state machine, timestamp backfill, order detail items display, currency fixes, customer stats, dashboard widget queries.
> This session targets: sales page zeros, COGS calculation, and verifying all prior fixes are actually working end-to-end.

---

## STEP 0 — DIAGNOSE BEFORE FIXING

Before writing any code, run these diagnostics and print results to terminal.

### 0.1 Confirm the order data is correct
```sql
SELECT id, order_number, status, delivered_at, payment_verified_at, total_amount, region_code
FROM orders
WHERE order_number = 'NS-20260504-0001';
```
Expected: delivered_at and payment_verified_at are NOT NULL.

### 0.2 Check what the sales endpoint actually queries
Find the sales analytics route handler (GET /api/sales or similar).
Print the exact WHERE clause it uses for the "30 kun" period.
The question is: does it filter by `delivered_at`, `payment_verified_at`, `created_at`, or `updated_at`?
And what status does it filter on?

### 0.3 Check if order_items has cost_price column
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
```
Print all columns. We need to see if `cost_price` exists.

### 0.4 Check order_items for this order
```sql
SELECT * FROM order_items
WHERE order_id = '4edd940a-87a0-401b-8312-5b0c68cfe28c';
```
Print results. Check if cost_price is populated or null.

### 0.5 Check what the accounting COGS query does
Find the accounting route (GET /api/accounting or similar).
Find specifically how it calculates COGS / "Sotilgan tovar narxi".
Print the query logic.

**DO NOT PROCEED to fixes until you have printed all 5 diagnostic results.**

---

## FIX 1 — SALES PAGE ZEROS (root cause first, then fix)

The sales page shows 0 revenue despite a DELIVERED order from May 4 existing.
Current date is May 6. The 30-day window should include May 4.

### 1.1 Find the exact bug
After reading the sales route, identify which of these is the actual cause:

**Cause A** — Wrong status filter
The query filters `status = 'PAID'` or `status = 'COMPLETED'` instead of `status = 'DELIVERED'`.

**Cause B** — Wrong timestamp field
The query uses `created_at` or `updated_at` for date range instead of `delivered_at`.

**Cause C** — Timezone issue
The query uses `DATE(delivered_at)` without timezone conversion. Korea is UTC+9.
Check if `delivered_at = '2026-05-04 00:22:41+00'` falls outside the window when
the backend computes "30 days ago" in UTC.

**Cause D** — Period boundary off by one
`delivered_at >= now() - interval '30 days'` vs `>`. Check boundary math.

**Cause E** — The backend fix from the previous session was written but the server
was not restarted / the new code was not actually running. Check if the server
process is running the updated code.

### 1.2 Apply the fix
Once cause is identified, fix the query so it:
```
WHERE status = 'DELIVERED'
  AND delivered_at >= :period_start   -- computed in UTC
  AND delivered_at < :period_end      -- computed in UTC
```
Period boundaries must be computed correctly for the selected window (7d/30d/90d/year).

### 1.3 Verify
After fix, hit the sales endpoint directly:
```bash
curl "http://localhost:3000/api/sales?period=30d&region=all"
# or whatever the actual endpoint URL is
```
Response should show revenue = 40000, orders = 1.

---

## FIX 2 — COGS (cost_price on order_items)

### 2.1 If cost_price column does NOT exist on order_items
Create a Drizzle migration to add it:
```typescript
// In the migration
cost_price: integer('cost_price').notNull().default(0),
// integer because KRW is stored as whole won
// For UZS orders it would be tiyin
```
Run: `pnpm nx run server:db:generate` then `pnpm nx run server:db:migrate`

### 2.2 If cost_price exists but is NULL for existing order_items
Update the existing row with the correct cost price.
The product is Dokdo Cream. Find its current cost_price from the products table:
```sql
SELECT id, name, cost_price FROM products WHERE name ILIKE '%dokdo%';
```
Then update the order_item:
```sql
UPDATE order_items
SET cost_price = <cost_price_from_products>
WHERE order_id = '4edd940a-87a0-401b-8312-5b0c68cfe28c';
```

### 2.3 Fix order creation to always snapshot cost_price
Find the order creation service (the function that inserts into order_items).
When inserting each order item, it MUST read cost_price from the product and store it:
```typescript
// When creating order items
const product = await db.query.products.findFirst({ where: eq(products.id, item.productId) });

await db.insert(orderItems).values({
  orderId: order.id,
  productId: item.productId,
  quantity: item.quantity,
  unit_price: product.sale_price,       // what customer pays
  cost_price: product.cost_price,       // what it costs you — SNAPSHOT THIS
  weight_grams: product.weight_grams,
  line_total: product.sale_price * item.quantity,
});
```
This must be done at order creation time, not fetched live later.

### 2.4 Fix the accounting COGS query
Find where accounting calculates "Sotilgan tovar narxi (FIFO)".
It should be:
```sql
SELECT COALESCE(SUM(oi.cost_price * oi.quantity), 0) as total_cogs
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'DELIVERED'
  AND o.delivered_at >= :period_start
  AND o.delivered_at < :period_end
  AND (:region = 'all' OR o.region_code = :region)
```
If the current query does `SUM(oi.cost_price)` without `* oi.quantity`, that's also a bug.
If it joins on `payment_verified_at` instead of `delivered_at`, fix it.

### 2.5 Verify accounting after fix
After fixing, the accounting page for May 2026 should show:
- Koreya savdosi: 40,000 ₩
- COGS: cost_price × 5 units (e.g. if cost_price = 7,000 → COGS = 35,000 ₩)
- Yalpi foyda: 40,000 - 35,000 = 5,000 ₩ (not 100% margin)

---

## FIX 3 — VERIFY ALL PRIOR FIXES ARE LIVE

The previous session's backend fixes may not be running if the server wasn't restarted.

### 3.1 Restart the dev server
```bash
# Kill existing server process and restart
pnpm nx serve server
```
Or however you run the backend in dev.

### 3.2 Hard refresh the admin frontend
Ctrl+Shift+R in Chrome to clear cache. Then check each page.

### 3.3 Check dashboard widgets
Navigate to http://localhost:4200
- "To'lov tasdiqlash" should show 0 (no pending payment orders)
- "Muddati tugayotgan bronlar" should show 0 (the DELIVERED order should not appear)
- "Yig'ish uchun tayyor" should show 0

If any of these still shows 1 for the DELIVERED order, the dashboard widget query
fix from the previous session did not apply correctly. Re-read the dashboard route
and fix the filter.

### 3.4 Check customer list currency
Navigate to http://localhost:4200/customers
The "JAMI SARFLAGAN" column for the KOR customer (Isokjon) should show "40,000 ₩"
NOT "40,000 UZS".
If still showing UZS, the frontend currency fix didn't apply. Re-read CustomerListPage
and fix the formatPrice call.

---

## FIX 4 — ORDER DETAIL: PRICE DISCREPANCY

From Image 3 (order detail), the order shows:
- Dokdo Cream, qty: 5, price: 8,000 ₩, subtotal: 40,000 ₩

But the inventory page (from earlier) showed Dokdo Cream at 7,000 ₩.
And the original order JSON has subtotal: 40,000 with 1 product.

Check which is correct:
```sql
SELECT sale_price, cost_price FROM products WHERE name ILIKE '%dokdo%';
SELECT unit_price, cost_price, quantity FROM order_items
WHERE order_id = '4edd940a-87a0-401b-8312-5b0c68cfe28c';
```
The displayed price in order detail should match the unit_price stored in order_items
(the snapshot at time of order), not the current product price.
This is already correct if order_items stores unit_price as a snapshot.
Just verify no live join to products.price is happening.

---

## FIX 5 — INVENTORY DEDUCTION CHECK

From the order detail, the item scan status shows "0 / 1 skanerlanidi" with PENDING.
This suggests an item scanning/packing feature. Separately, check if inventory was
decremented when this order was created or marked delivered:

```sql
SELECT stock_quantity FROM products WHERE name ILIKE '%dokdo%';
```

Previously showed 5 units. If the order contained 5 Dokdo Cream units and inventory
is still 5, deduction is not wired up.

If stock is still 5 (unchanged after a 5-unit order), find the inventory deduction logic
and ensure it runs on PAYMENT_VERIFIED or order creation, depending on your business rule.

---

## FINAL VERIFICATION CHECKLIST

Run through each of these manually after all fixes:

[ ] Sales page "30 kun" shows: Daromad 40,000 ₩, Buyurtmalar 1
[ ] Sales page "Sotuvlar dinamikasi" chart shows a bar on May 4 or 5 (timezone)
[ ] Accounting May 2026: COGS is NOT 0, margin is NOT 100%
[ ] Accounting: Yalpi foyda = total_amount - COGS (correct math)
[ ] Dashboard: No widgets showing counts > 0 for the DELIVERED order
[ ] Customer list: Isokjon shows "40,000 ₩" not "40,000 UZS"
[ ] Customer detail: JAMI BUYURTMALAR = 1 (not 0)
[ ] Order detail: Price shows order_items snapshot price, not live product price
[ ] Inventory: Dokdo Cream stock decremented by order quantity

---

## NOTES

- After each fix, restart the server AND hard refresh the browser.
- If a query change is in a TypeScript file, typecheck before testing: `pnpm nx typecheck server`
- Do not create new Drizzle migrations unless the schema actually needs a new column.
  Data fixes go in SQL scripts, not migrations.
- If you find that Phase 4 (sales) fix from the previous session used the wrong
  timestamp field, that's the most likely cause of sales page zeros. Fix it directly.
