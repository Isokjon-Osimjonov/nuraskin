# NuraSkin — Order Lifecycle, Accounting & Data Integrity Audit + Fix Plan

> **Purpose**: This is a Claude Code execution prompt. Follow each phase sequentially.
> After each phase, run the validation checks before moving to the next.
> Do NOT skip phases. Do NOT make assumptions — read the actual codebase first.

---

## PHASE 0 — CODEBASE DISCOVERY (do this first, before writing ANY code)

### 0.1 Map the project structure
```
Find and read:
- The Drizzle schema files (all tables, especially: orders, order_items, customers, products, inventory, coupons, rate_snapshots, accounting/expenses)
- The order-related API routes (create order, update status, payment verification, packing, shipping, delivery)
- The admin dashboard data-fetching endpoints (dashboard stats, sales analytics, accounting P&L)
- The customer stats endpoints (total spent, order count)
- The currency utility file (formatPrice, formatKrw, formatUzs, displayKrw, displayUzs)
- The admin frontend pages: Dashboard, Orders, Sales, Accounting, Customer list, Customer detail
```

### 0.2 Document what you find
Before making any changes, write a brief summary of:
1. The current order status enum/values used in the schema
2. Which timestamps exist on the orders table
3. Whether `order_items` table exists and what columns it has
4. Whether `cost_price` is stored on order items
5. How inventory is currently managed (manual? auto-decrement? when?)
6. How the accounting/P&L page calculates revenue, COGS, gross profit
7. How the sales page queries orders (by status? by timestamp? by date range?)
8. How dashboard action-required widgets query their counts
9. How customer `total_spent` and `total_orders` are calculated (aggregated live? or stored?)
10. Whether rate_snapshot is captured on order creation for UZB orders

**Print this summary to the terminal before proceeding.**

---

## PHASE 1 — ORDER STATE MACHINE (Backend)

### Problem
Order status can be changed arbitrarily (e.g., via Drizzle Studio) without setting corresponding timestamps. This causes cascading data integrity issues across dashboard, sales, and accounting.

### Requirements

#### 1.1 Define the canonical order lifecycle
```
PENDING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → PACKING → SHIPPED → DELIVERED
                                    ↘ PAYMENT_REJECTED (terminal)
                        any state   → CANCELLED (terminal)
```

#### 1.2 Create/update a service function: `transitionOrderStatus()`
Location: server-side order service (e.g., `libs/` or `apps/server/src/services/`)

```typescript
// Pseudo-structure — adapt to actual codebase patterns
interface StatusTransition {
  from: OrderStatus[];
  to: OrderStatus;
  requiredFields?: string[];  // fields that must be provided
  sideEffects: (order, payload, tx) => Promise<void>;  // what happens on transition
}
```

Each transition MUST:

| Transition | Timestamp to set | Side effects |
|---|---|---|
| → PAYMENT_SUBMITTED | `payment_submitted_at` | Save payment receipt URL |
| → PAYMENT_VERIFIED | `payment_verified_at`, set `payment_verified_by` | — |
| → PAYMENT_REJECTED | `payment_rejected_at` | Set `payment_note` with reason, release reserved inventory |
| → PACKING | `packed_at`, `packed_by` | — |
| → SHIPPED | `shipped_at` | Require `tracking_number` |
| → DELIVERED | `delivered_at` | Finalize COGS snapshot, decrement inventory if not done earlier |
| → CANCELLED | `updated_at` | Release reserved inventory, void any points/rewards |

#### 1.3 Enforce: NO direct status writes
- All order status changes MUST go through `transitionOrderStatus()`
- The function validates the `from → to` transition is legal
- The function sets ALL required timestamps atomically in a single DB transaction
- Return clear error if transition is invalid

#### 1.4 API routes
Ensure every status-change endpoint calls `transitionOrderStatus()`:
- `PATCH /api/orders/:id/verify-payment`
- `PATCH /api/orders/:id/reject-payment`
- `PATCH /api/orders/:id/pack`
- `PATCH /api/orders/:id/ship` (requires tracking_number in body)
- `PATCH /api/orders/:id/deliver`
- `PATCH /api/orders/:id/cancel`

Do NOT use a generic `PATCH /api/orders/:id { status: "..." }` for lifecycle transitions.

---

## PHASE 2 — ORDER ITEMS & COGS (Backend + Schema)

### Problem
Accounting shows 100% margin because COGS is 0. The system doesn't track cost_price on order line items.

### Requirements

#### 2.1 Verify/create `order_items` table
It must have at minimum:
```
id, order_id, product_id, variant_id (nullable),
quantity, unit_price (sale price at time of order),
cost_price (purchase/cost price at time of order — for FIFO/COGS),
weight_grams (per unit), line_total, created_at
```

- `unit_price` = what the customer pays per unit (snapshot, not a join to products table)
- `cost_price` = what the product costs you per unit (snapshot from inventory/product at time of sale)
- Both must be stored in the DB currency convention: KRW as whole won, UZS as tiyin

#### 2.2 On order creation
When a new order is created:
1. For each item, read the current `cost_price` from the products/inventory table
2. Store it on the order_item row
3. Calculate `line_total = quantity × unit_price`
4. Sum all line_totals → `order.subtotal`
5. Apply coupon discount → `order.discount_amount`
6. Add cargo → `order.cargo_fee`
7. Final: `order.total_amount = subtotal - discount_amount + cargo_fee`

#### 2.3 Inventory deduction
Decide when inventory is decremented (recommend: on PAYMENT_VERIFIED or on order creation with a "reserved" concept). Implement consistently. The Dokdo Cream inventory showing 5 after a DELIVERED order means this isn't wired up.

#### 2.4 COGS for accounting
The accounting page's COGS calculation should be:
```sql
SELECT SUM(oi.cost_price * oi.quantity) as total_cogs
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'DELIVERED'
  AND o.delivered_at >= :period_start
  AND o.delivered_at < :period_end
```

---

## PHASE 3 — DASHBOARD WIDGETS FIX (Backend queries)

### Problem
"Muddati tugayotgan bronlar" shows 1 for a DELIVERED order. Dashboard stats show 0 revenue.

### Requirements

#### 3.1 "To'lov tasdiqlash" (Payment awaiting verification)
```sql
WHERE status = 'PAYMENT_SUBMITTED'
  AND payment_submitted_at IS NOT NULL
  AND payment_verified_at IS NULL
  AND payment_rejected_at IS NULL
```

#### 3.2 "Yig'ish uchun tayyor" (Ready to pack)
```sql
WHERE status = 'PAYMENT_VERIFIED'
  AND payment_verified_at IS NOT NULL
  AND packed_at IS NULL
```

#### 3.3 "Muddati tugayotgan bronlar" (Expiring reservations)
```sql
WHERE status IN ('PENDING_PAYMENT', 'PAYMENT_SUBMITTED')
  AND payment_verified_at IS NULL
  AND created_at < NOW() - INTERVAL '48 hours'  -- or whatever TTL you use
```
**Critical**: Must exclude DELIVERED, SHIPPED, PACKING, CANCELLED, PAYMENT_REJECTED.

#### 3.4 "Kam qolgan tovarlar" (Low stock)
```sql
WHERE stock_quantity <= low_stock_threshold
  AND stock_quantity > 0
```
Verify this query is correct — it currently shows 1, check if that's actually valid for Dokdo Cream (5 units — is the threshold set to 5 or higher?).

#### 3.5 "Bugungi daromad" (Today's revenue)
```sql
WHERE status = 'DELIVERED'
  AND delivered_at >= :today_start
  AND delivered_at < :tomorrow_start
```
NOT by `created_at`. NOT by `updated_at`. By `delivered_at`.

#### 3.6 Revenue chart ("Oxirgi 7 kunlik daromad")
Same logic — group by `delivered_at` date, sum `total_amount`, broken down by region_code.

---

## PHASE 4 — SALES PAGE FIX (Backend queries)

### Problem
Sales page shows all zeros despite a delivered order existing.

### Requirements

#### 4.1 Revenue calculation
Must query orders WHERE `status = 'DELIVERED'` AND `delivered_at` falls within selected period (7 kun / 30 kun / 90 kun / Bu yil).

#### 4.2 "Sotuvlar dinamikasi" chart
Group by day/week, sum revenue from DELIVERED orders by `delivered_at`, split by region_code.

#### 4.3 "O'rtacha buyurtma" (Average order value)
```
SUM(total_amount) / COUNT(orders) WHERE status = 'DELIVERED' AND delivered_at in period
```

#### 4.4 "Yalpi marja" (Gross margin)
```
(SUM(revenue) - SUM(cogs)) / SUM(revenue) × 100
```
This requires COGS from Phase 2 to be working.

#### 4.5 "Mahsulotlar samaradorligi" table
Join order_items to orders, aggregate by product: units sold, revenue, margin, region.

#### 4.6 "Hududiy taqsimot" (Regional breakdown)
Group delivered orders by `region_code`, show revenue split.

#### 4.7 Period comparison ("vs prev period")
Compare current period stats against the equivalent previous period. Show percentage change.

---

## PHASE 5 — ACCOUNTING PAGE FIX (Backend)

### Problem
P&L shows 40,000 ₩ revenue with 0 COGS = 100% margin. Real margin should account for product cost.

### Requirements

#### 5.1 Revenue (TUSHUMLAR)
```
Koreya savdosi = SUM(total_amount) WHERE region_code = 'KOR' AND status = 'DELIVERED' AND delivered_at in period
O'zbekiston savdosi = same for 'UZB'
```

#### 5.2 COGS — "Sotilgan tovar narxi (FIFO)"
```
SUM(oi.cost_price × oi.quantity) from delivered orders in period
```
This is the cost of goods sold. It reduces gross profit.

#### 5.3 Delivery cost — "Yetkazib berish xarajati"
```
SUM(o.cargo_cost_krw) from delivered orders in period
```
For UZB orders, this is the actual cargo cost in KRW.

#### 5.4 Gross profit — "Yalpi foyda"
```
Revenue - COGS - Delivery costs
```

#### 5.5 Operating expenses (OPERATSION XARAJATLAR)
These come from a manual expenses table. Verify the expenses query works correctly for the period.

#### 5.6 Net profit — "Sof foyda"
```
Gross profit - Operating expenses - Order-level expenses
```

#### 5.7 Coupon/discount line
Add a line item: "Chegirmalar" = `SUM(discount_amount)` from delivered orders in period. This should be subtracted from gross revenue or shown as a separate line.

#### 5.8 Inventory valuation — "Ombor qiymati"
```
SUM(stock_quantity × cost_price) for all active products
```
Currently shows 35,000 ₩ (5 × 7,000). Verify this is correct after inventory deduction is implemented.

---

## PHASE 6 — CURRENCY DISPLAY BUG (Frontend)

### Problem
Customer list shows "40,000 UZS" for a KOR customer. Should be "40,000 ₩".

### Requirements

#### 6.1 Customer list page
Find where `JAMI SARFLAGAN` column is rendered. It must use:
```typescript
formatPrice(customer.total_spent, customer.region_code)
```
NOT hardcoded UZS. NOT a default fallback to UZS.

#### 6.2 Audit ALL places where `formatPrice` / `formatKrw` / `formatUzs` are called
Search the entire admin frontend for:
- Hardcoded "UZS" or "so'm" strings
- Calls to `formatUzs()` that should be `formatPrice()` with region
- Missing region_code pass-through in component props

Fix every instance where currency is displayed without checking the order/customer region.

#### 6.3 Customer detail page
- "JAMI SARFLAGAN" stat card: use customer's region for formatting
- "MUDDATI O'TGAN QARZLAR": same
- Order history table "Summa" column: use each order's currency/region

---

## PHASE 7 — CUSTOMER STATS FIX (Backend)

### Problem
Customer detail shows "JAMI BUYURTMALAR: 0" but order history lists 1 order.

### Requirements

#### 7.1 Find the stats query
The summary cards (total orders, total spent, overdue debts, waitlist) are likely a separate API call from the order history list. Find both endpoints.

#### 7.2 Make filters consistent
Both queries must use the same filter criteria. If the order list shows all orders regardless of payment status, the count should too. Recommended approach:
```sql
-- Total orders (all non-cancelled)
SELECT COUNT(*) FROM orders WHERE customer_id = :id AND status != 'CANCELLED'

-- Total spent (only delivered)
SELECT SUM(total_amount) FROM orders WHERE customer_id = :id AND status = 'DELIVERED'
```

#### 7.3 Overdue debts
```sql
SELECT SUM(total_amount) FROM orders
WHERE customer_id = :id
  AND status IN ('PAYMENT_SUBMITTED')
  AND payment_verified_at IS NULL
  AND created_at < NOW() - INTERVAL '48 hours'
```

---

## PHASE 8 — COUPON INTEGRATION

### Problem
Coupon fields exist in schema but aren't displayed in order detail or factored into accounting.

### Requirements

#### 8.1 Order creation with coupon
When a coupon is applied:
1. Validate coupon (exists, not expired, not over usage limit, meets minimum order)
2. Calculate `discount_amount` based on coupon type (percentage or fixed)
3. Store `coupon_id`, `coupon_code`, `discount_amount` on the order
4. `total_amount = subtotal - discount_amount + cargo_fee`

#### 8.2 Order detail page (admin)
Display coupon info when present:
- Coupon code used
- Discount amount
- Show subtotal, discount, cargo, and final total as separate lines

#### 8.3 Accounting integration
- Revenue should be `total_amount` (already net of discount)
- Add a "Chegirmalar (kuponlar)" summary line showing total discount given in the period
- This is informational — it doesn't change the P&L math since total_amount already accounts for it

---

## PHASE 9 — EXCHANGE RATE SNAPSHOT

### Problem
`rate_snapshot_id` is null. UZB orders need a frozen exchange rate at time of order.

### Requirements

#### 9.1 On order creation (UZB region)
1. Fetch the current active rate from the rates table
2. Store `rate_snapshot_id` on the order
3. Use this rate for all UZS display calculations for this order

#### 9.2 For KOR orders
`rate_snapshot_id` can be null — no conversion needed.

#### 9.3 Accounting
When calculating UZB revenue in KRW (for P&L consolidation), use each order's snapshot rate, not the current rate.

---

## PHASE 10 — CARGO FEE CALCULATION

### Problem
`cargo_fee: 0` and `cargo_cost_krw: 0` despite `total_weight_grams: 1250`.

### Requirements

#### 10.1 Clarify the logic
- `cargo_fee` = what the CUSTOMER pays for shipping (may be 0 for free shipping promos or KOR domestic)
- `cargo_cost_krw` = what it actually COSTS you to ship (your expense)
- For KOR domestic orders: both may be 0 if you handle delivery yourself
- For UZB orders: calculate from rate settings (`kargo_krw_per_kg × weight_kg`)

#### 10.2 On order creation
```typescript
const weightKg = totalWeightGrams / 1000;
if (region === 'UZB') {
  order.cargo_cost_krw = Math.ceil(weightKg * currentRate.cargo_krw_per_kg);
  order.cargo_fee = order.cargo_cost_krw; // or apply free shipping threshold
}
```

#### 10.3 Accounting
`cargo_cost_krw` feeds into "Yetkazib berish xarajati" (delivery expense) line in P&L.

---

## PHASE 11 — FULL CYCLE INTEGRATION TEST

> **This is the most important phase.** After all fixes are applied, run this test to validate the entire order-to-accounting pipeline.

### 11.1 Setup: Seed test data

Create a test script (e.g., `scripts/test-full-cycle.ts` or use your API directly).

**Seed products:**
```
Product A: "Test Cream KOR"  — sale_price: 25,000 KRW, cost_price: 10,000 KRW, stock: 20, weight: 250g
Product B: "Test Serum KOR"  — sale_price: 35,000 KRW, cost_price: 15,000 KRW, stock: 10, weight: 180g
Product C: "Test Mask UZB"   — sale_price: 150,000 UZS (as tiyin: 15000000), cost_price: 50,000 UZS (5000000 tiyin), stock: 15, weight: 300g
```

**Seed customers:**
```
Customer KOR: region=KOR, name="Test Koreya Mijoz"
Customer UZB: region=UZB, name="Test O'zbekiston Mijoz"
```

**Seed a coupon:**
```
Code: "TEST20", type: percentage, value: 20%, min_order: 30,000 KRW, max_uses: 10, active: true
```

**Set exchange rate:**
```
1 KRW = 9 UZS, cargo = 14,700 KRW/kg
```

### 11.2 Test Case 1: KOR order — full lifecycle, no coupon

```
1. Create order: Customer KOR buys 2× Product A
   ASSERT: order.subtotal = 50,000 KRW
   ASSERT: order.cargo_fee = 0 (domestic)
   ASSERT: order.total_amount = 50,000 KRW
   ASSERT: order_items has 2 rows with cost_price = 10,000 each
   ASSERT: order.status = 'PENDING_PAYMENT'

2. Submit payment (upload receipt)
   ASSERT: status = 'PAYMENT_SUBMITTED'
   ASSERT: payment_submitted_at IS NOT NULL
   ASSERT: Dashboard "To'lov tasdiqlash" count incremented by 1

3. Verify payment
   ASSERT: status = 'PAYMENT_VERIFIED'
   ASSERT: payment_verified_at IS NOT NULL
   ASSERT: Dashboard "To'lov tasdiqlash" decremented
   ASSERT: Dashboard "Yig'ish uchun tayyor" incremented

4. Pack order
   ASSERT: status = 'PACKING'
   ASSERT: packed_at IS NOT NULL

5. Ship order (tracking: "KOR-TEST-001")
   ASSERT: status = 'SHIPPED'
   ASSERT: shipped_at IS NOT NULL
   ASSERT: tracking_number = 'KOR-TEST-001'

6. Deliver order
   ASSERT: status = 'DELIVERED'
   ASSERT: delivered_at IS NOT NULL
   ASSERT: Product A stock = 18 (was 20, sold 2)

7. Check accounting (current month):
   ASSERT: Koreya savdosi = 50,000 ₩
   ASSERT: COGS = 20,000 ₩ (2 × 10,000)
   ASSERT: Yalpi foyda = 30,000 ₩
   ASSERT: Margin = 60%

8. Check sales page:
   ASSERT: Daromad = 50,000 ₩
   ASSERT: Buyurtmalar = 1
   ASSERT: O'rtacha buyurtma = 50,000 ₩

9. Check customer stats:
   ASSERT: JAMI BUYURTMALAR = 1
   ASSERT: JAMI SARFLAGAN = "50,000 ₩" (KRW, not UZS)
```

### 11.3 Test Case 2: KOR order — with coupon

```
1. Create order: Customer KOR buys 1× Product A + 1× Product B, apply coupon "TEST20"
   subtotal = 25,000 + 35,000 = 60,000
   discount = 60,000 × 20% = 12,000
   total = 48,000
   ASSERT: order.coupon_code = "TEST20"
   ASSERT: order.discount_amount = 12,000
   ASSERT: order.total_amount = 48,000

2. Run through full lifecycle to DELIVERED

3. Check accounting:
   ASSERT: Revenue includes 48,000 (not 60,000)
   ASSERT: COGS = 10,000 + 15,000 = 25,000
   ASSERT: Gross profit = 23,000
   ASSERT: Chegirmalar summary shows 12,000 ₩ total discounts for period

4. Check order detail page:
   ASSERT: Shows coupon code "TEST20"
   ASSERT: Shows discount -12,000 ₩
   ASSERT: Shows breakdown: subtotal → discount → total
```

### 11.4 Test Case 3: UZB order — with cargo and rate snapshot

```
1. Create order: Customer UZB buys 3× Product C
   subtotal = 450,000 UZS (45000000 tiyin)
   weight = 900g → 0.9 kg
   cargo_cost_krw = ceil(0.9 × 14,700) = 13,230 KRW
   cargo_fee to customer in UZS = 13,230 × 9 = 119,070 UZS → rounded
   ASSERT: rate_snapshot_id IS NOT NULL
   ASSERT: cargo_fee calculated correctly

2. Run through full lifecycle to DELIVERED

3. Check accounting:
   ASSERT: O'zbekiston savdosi shows correct UZS amount converted to KRW via snapshot rate
   ASSERT: Yetkazib berish xarajati includes cargo_cost_krw
   ASSERT: COGS = 3 × 50,000 UZS cost = 150,000 UZS → converted to KRW

4. Check customer page:
   ASSERT: JAMI SARFLAGAN shows UZS formatted (NOT KRW)
   ASSERT: Region shows UZB
```

### 11.5 Test Case 4: Payment rejection

```
1. Create order, submit payment
2. Reject payment with note "Kvitansiya noto'g'ri"
   ASSERT: status = 'PAYMENT_REJECTED'
   ASSERT: payment_rejected_at IS NOT NULL
   ASSERT: payment_note = "Kvitansiya noto'g'ri"
   ASSERT: Does NOT appear in sales, accounting, or revenue
   ASSERT: Inventory NOT decremented (or re-released if reserved on creation)
```

### 11.6 Test Case 5: Order cancellation

```
1. Create order, verify payment, start packing
2. Cancel order
   ASSERT: status = 'CANCELLED'
   ASSERT: Inventory restored
   ASSERT: Does NOT appear in revenue/accounting
   ASSERT: Dashboard widgets exclude this order
```

### 11.7 Test Case 6: Expiring reservation

```
1. Create order with payment_submitted_at = 49 hours ago (past TTL)
2. Do NOT verify payment
   ASSERT: Dashboard "Muddati tugayotgan bronlar" count includes this order
   ASSERT: Does NOT appear in sales or accounting
```

### 11.8 Test Case 7: Dashboard aggregate verification

After all test cases above, verify dashboard totals:
```
- Bugungi daromad = sum of all DELIVERED orders with delivered_at = today
- Bugungi buyurtmalar = count of orders created today
- Ombor qiymati = sum of (stock × cost_price) for all products (after decrements)
- Revenue chart = correct daily breakdown
- All "Bajarilishi kerak" counts match actual filtered counts
```

### 11.9 Test Case 8: Invalid state transitions

```
ASSERT: Cannot go PENDING_PAYMENT → DELIVERED (must error)
ASSERT: Cannot go PAYMENT_VERIFIED → PAYMENT_SUBMITTED (backward)
ASSERT: Cannot go DELIVERED → SHIPPED (backward)
ASSERT: Cannot go CANCELLED → anything (terminal)
ASSERT: Cannot go PAYMENT_REJECTED → PAYMENT_VERIFIED (terminal)
ASSERT: Ship without tracking_number → error
```

---

## PHASE 12 — CLEANUP & DATA MIGRATION

### 12.1 Fix existing bad data
Write a one-time migration script for any existing orders that have status = DELIVERED but null timestamps:
```sql
-- Fix orders that were manually set to DELIVERED
UPDATE orders
SET
  payment_verified_at = COALESCE(payment_verified_at, payment_submitted_at, created_at),
  delivered_at = COALESCE(delivered_at, updated_at),
  shipped_at = COALESCE(shipped_at, updated_at),
  packed_at = COALESCE(packed_at, updated_at)
WHERE status = 'DELIVERED'
  AND delivered_at IS NULL;
```

### 12.2 Add DB constraints (optional but recommended)
Consider adding CHECK constraints or triggers:
```sql
-- Cannot be DELIVERED without delivered_at
ALTER TABLE orders ADD CONSTRAINT chk_delivered_timestamp
  CHECK (status != 'DELIVERED' OR delivered_at IS NOT NULL);
```

---

## EXECUTION NOTES

### Currency utility reference (already in codebase)
```typescript
// DB storage:
//   KRW: whole won. 15,000 ₩ = 15000
//   UZS: tiyin (×100). 213,000 so'm = 21300000
//
// displayKrw(won) → rounds to nearest 100
// displayUzs(tiyin) → converts to som, rounds to nearest 1000
// formatPrice(amount, region) → formatted string with currency symbol
//   USE THIS EVERYWHERE in the frontend
```

### File naming conventions
Follow existing project patterns. Check if services are in `apps/server/src/services/`, routes in `apps/server/src/routes/`, etc.

### Testing approach
- If the project has an existing test framework (vitest, jest), add the integration tests there
- If not, create a standalone script `scripts/full-cycle-test.ts` that hits the API endpoints sequentially and asserts responses
- The script should be runnable with `npx tsx scripts/full-cycle-test.ts`
- Clean up test data after the run (or use a test database)

### Priority order if time-constrained
1. Phase 1 (state machine) — prevents all future data corruption
2. Phase 2 (order items + COGS) — accounting is meaningless without this
3. Phase 6 (currency bug) — visible UI bug, quick fix
4. Phase 7 (customer stats) — visible UI bug, quick fix
5. Phase 3 (dashboard widgets) — incorrect counts
6. Phase 4 + 5 (sales + accounting) — depend on phases 1-2
7. Phase 8-10 (coupon, rates, cargo) — feature completeness
8. Phase 11 (full test) — validation
9. Phase 12 (data migration) — cleanup
