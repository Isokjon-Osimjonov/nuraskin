# NuraSkin — Session 3 Fix Plan

> Gemini CLI: read this file fully before touching any code.
> Run all DIAGNOSE blocks first and print results. Then fix in order.

---

## CURRENT STATE SUMMARY

Working: sales "Hammasi" shows revenue, COGS calculates at 12.5% margin, dashboard expiring/low-stock widgets.
Broken: cart stock enforcement, sales region filter, dashboard 7-day chart, chart date off by 1 day.
Remove completely: sevimlilar (wishlist) from frontend profile, product reviews display.

---

## BUG 1 — CART QUANTITY NOT CAPPED BY STOCK

### Evidence
Cart shows 17 units of Dokdo Cream. Inventory has 5 units. No error shown.

### Root cause areas to check
1. The `+` button in the cart quantity control — does it check available stock before incrementing?
2. The product page "Savatchada bor" (add to cart) — does it enforce max on initial add?
3. Is available stock even sent to the frontend? Check the cart item API response and product detail API response — do they include a `stock_quantity` or `available` field?
4. Is there server-side validation on cart update? Check the PATCH /cart or PUT /cart/:itemId endpoint.

### DIAGNOSE first
```
Read the cart component (quantity +/- controls).
Read the add-to-cart handler on the product detail page.
Read the cart API endpoint that updates quantity.
Print: does the frontend receive stock_quantity for each cart item?
Print: does the server validate quantity <= stock on cart update?
```

### Fix requirements (all 3 layers)

#### Layer 1 — API: include available stock in cart response
When returning cart items, each item must include `available_stock`:
```typescript
// In the cart query, join to inventory to get current available qty
// Return: { ...cartItem, available_stock: product.current_stock }
```

#### Layer 2 — Server validation: reject over-stock quantities
In the cart update endpoint (PATCH /cart/:itemId or similar):
```typescript
if (requestedQuantity > availableStock) {
  return res.status(400).json({
    error: 'INSUFFICIENT_STOCK',
    message: `Faqat ${availableStock} ta mavjud`,
    available: availableStock
  });
}
```
Also validate on checkout creation — the final guard before order is created.

#### Layer 3 — Frontend: enforce in UI

In the cart quantity control component:
```typescript
// Disable + button when quantity >= available_stock
const canIncrement = item.quantity < item.available_stock;

// On + click, if at limit show toast instead of incrementing
if (item.quantity >= item.available_stock) {
  toast.warning(`Maksimal miqdor: ${item.available_stock} ta`);
  return;
}
```

On the product detail page add-to-cart:
```typescript
// If current cart qty + adding qty > stock, cap it and toast
const currentCartQty = getCartQty(productId);
const canAdd = Math.min(addQty, availableStock - currentCartQty);
if (canAdd <= 0) {
  toast.warning(`Savatchada allaqachon ${currentCartQty} ta bor. Maksimal: ${availableStock} ta`);
  return;
}
```

Also: if `available_stock` is 0, show "Tugadi" (out of stock) badge and disable the button entirely.

#### Layer 4 — Product page stock badge
Currently shows "MAVJUD" even when stock is low (5 units with warning in admin).
Add a low stock threshold (e.g. <= 10):
```
stock > threshold  → "MAVJUD" (green)
0 < stock <= threshold → "Kam qoldi: {n} ta" (orange)
stock = 0 → "Tugadi" (red, button disabled)
```

---

## BUG 2 — SALES PAGE REGION FILTER BROKEN

### Evidence
"Hammasi" filter → 40,000 ₩, 1 order ✅
"Koreya" filter → 0 ₩, 0 orders ✗
The order has region_code = 'KOR' in the database.

### DIAGNOSE first
```
1. Find the sales analytics endpoint handler.
2. Print the exact SQL or ORM query it runs when region = 'KOR'.
3. Check: what parameter name does the frontend send? (region? regionCode? filter?)
4. Check: what does the backend expect? Does it filter on orders.region_code?
5. Run this query manually:
   SELECT COUNT(*), SUM(total_amount) FROM orders
   WHERE status = 'DELIVERED'
     AND region_code = 'KOR'
     AND delivered_at >= NOW() - INTERVAL '30 days';
   Print the result.
```

### Likely causes
**Cause A** — Parameter mismatch: frontend sends `region=KOR` but backend checks `regionCode` or vice versa.

**Cause B** — Wrong comparison value: backend compares `region_code = 'Koreya'` (Uzbek label) instead of `region_code = 'KOR'` (actual DB value).

**Cause C** — The "Hammasi" query has no region filter (works), but the "Koreya" query adds `AND region_code = :region` where `:region` is undefined/null/wrong string.

**Cause D** — The region filter is applied BEFORE the status/date filter, causing an incorrect query structure.

### Fix
Once the exact cause is found, fix the backend query so:
```typescript
// region param from frontend: 'all' | 'KOR' | 'UZB'
if (region && region !== 'all') {
  query.where(eq(orders.region_code, region)); // 'KOR' or 'UZB' directly
}
```
And ensure the frontend sends `'KOR'` and `'UZB'` exactly — not translated labels.

### Also fix: the Mahsulotlar samaradorligi (product performance) table
This table also shows "Hech qanday ma'lumot topilmadi" even though a delivered order with Dokdo Cream exists.
Check if it uses the same broken region filter or has a separate bug.

### Also fix: Hududiy taqsimot (regional breakdown) donut chart
Verify it works correctly for both KOR and UZB once the filter is fixed.

---

## BUG 3 — DASHBOARD 7-DAY REVENUE CHART EMPTY

### Evidence
Image 4 shows "Oxirgi 7 kunlik daromad" chart completely empty, no bars.
The sales page chart works fine. These are different data sources.

### DIAGNOSE first
```
1. Find the dashboard API endpoint (GET /api/dashboard or similar).
2. Find specifically how "oxirgi 7 kunlik daromad" (last 7 days revenue) is queried.
3. Print the exact query — does it filter by delivered_at? created_at? payment_verified_at?
4. Run manually:
   SELECT DATE(delivered_at AT TIME ZONE 'Asia/Seoul') as day,
          SUM(total_amount), region_code
   FROM orders
   WHERE status = 'DELIVERED'
     AND delivered_at >= NOW() - INTERVAL '7 days'
   GROUP BY day, region_code;
   Print result.
5. Compare: the sales page chart query vs the dashboard chart query. What's different?
```

### Fix
The dashboard chart query must use the same logic as the working sales page query:
- Filter by `status = 'DELIVERED'`
- Use `delivered_at` for date range, NOT `created_at` or `updated_at`
- Group by day in Asia/Seoul timezone

---

## BUG 4 — CHART DATE OFF BY 1 DAY (TIMEZONE)

### Evidence
Image 6 chart tooltip shows `2026-05-03`. The order's `delivered_at` is `2026-05-04 00:22:41+00` (UTC).
In UTC, this IS May 4. But the chart is showing May 3 — which means the date is being computed in UTC-something or incorrectly.

Wait: `00:22 UTC` = `09:22 KST (UTC+9)` = still May 4 in Korea.
So the date should be May 4 in any timezone, including UTC. The chart showing May 3 is wrong.

### DIAGNOSE
```
Check how the sales chart groups by date:
- Does it use DATE(delivered_at) in SQL? (returns UTC date — would give May 4, correct)
- Does it use JavaScript's new Date().toLocaleDateString()? (depends on server timezone)
- Does the server process dates in UTC? Is TZ env var set on the server?
- Check: process.env.TZ or pg timezone setting.

Run: SELECT delivered_at, DATE(delivered_at), delivered_at AT TIME ZONE 'UTC' FROM orders;
Print result.
```

### Fix
Ensure date grouping is consistent. Recommended: always group by UTC date on the server, display as-is on frontend. If your server's system timezone is set incorrectly (e.g. UTC-something), it could shift dates backward.

If using Node.js date manipulation:
```typescript
// Wrong — depends on server local timezone
new Date(delivered_at).toISOString().split('T')[0]

// Correct — explicit UTC
new Date(delivered_at).toISOString().split('T')[0] // This IS UTC, should give 2026-05-04

// If you want KST display:
new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ... }).format(date)
```

Set server environment: `TZ=UTC` in your server's start command or .env to ensure consistency.

---

## TASK 5 — REMOVE SEVIMLILAR (WISHLIST) FROM FRONTEND COMPLETELY

### Scope
Remove the wishlist/favorites feature entirely from the customer-facing frontend.
This is a UI removal — do NOT drop DB tables yet (data stays, just hidden from UI).

### Remove from:
1. **Profile page** — the "Sevimlilar" tab and its content panel
2. **Product cards** — the heart/like icon on product listing cards
3. **Product detail page** — the heart icon (❤) in the top-right of the product image area (visible in Image 3)
4. **Navigation/header** — if there's a wishlist icon in the nav
5. **Any API calls** — remove/comment out frontend calls to wishlist endpoints (keep the endpoints themselves)
6. **Routes** — if there's a `/profile/wishlist` or `/sevimlilar` route, remove it

### Do NOT remove:
- The database tables (wishlist_items or similar)
- The backend API endpoints
- Just the frontend UI and routes

---

## TASK 6 — REMOVE PRODUCT REVIEWS FROM FRONTEND

### Evidence
Image 3 product page shows "24 sharhlar" (24 reviews) with star rating.

### Scope
Remove reviews display from the frontend — same approach as wishlist: UI removal only.

### Remove from:
1. **Product detail page** — star rating display, "24 sharhlar" text, any reviews section/tab
2. **Product cards** in listing pages — star ratings shown under product name
3. **"Sharhlar" tab** on product detail (if it exists as a separate tab)
4. **Any review submission forms**
5. **Routes** — remove any `/products/:id/reviews` frontend route

### Do NOT remove:
- Backend review endpoints
- Database review data

---

## BUG 7 — DASHBOARD "BUGUNGI DAROMAD" CLARIFICATION

Dashboard shows "Bugungi daromad: 0 ₩". The only order was delivered May 4. Today is May 6.
This is CORRECT behavior — today's revenue is genuinely 0.

However, verify: does the dashboard show DELIVERED orders from today, or PAYMENT_VERIFIED orders from today?
The business definition should be: revenue = `delivered_at = today`. If you want to show "confirmed revenue pipeline",
also consider showing "today's verified payments" separately.

No code change needed IF current behavior is intentional. Just confirm the query uses `delivered_at` date = today.

---

## BUG 8 — INVENTORY INCONSISTENCY: STOCK SHOWS 5 BUT "IN STOCK" STATUS

### Evidence
Image 2: Dokdo Cream, JAMI QOLDIQ: ⚠ 5, Status: In Stock.
The warning triangle suggests it's below low-stock threshold.

### Check:
```sql
SELECT low_stock_threshold FROM products WHERE name ILIKE '%dokdo%';
-- OR
SELECT * FROM inventory_settings;
```

If low_stock_threshold = 5, then 5 units exactly AT threshold should be "Low Stock" warning, not just "In Stock".
Consider: status should be "Low Stock" (sariq/yellow) when quantity <= threshold, not just a warning triangle alongside "In Stock".

The dashboard "Kam qolgan tovarlar: 1" is correctly counting this product.
But the inventory page Status column showing "In Stock" is misleading when the warning triangle is also there.

Fix: if quantity <= low_stock_threshold, show status as "Kam qoldi" (low stock) in orange/yellow, not "In Stock".

---

## BUG 9 — CART RESERVATION vs ACTUAL STOCK

### Critical business logic question:
When a customer adds to cart, is stock "reserved" or is it only decremented on order creation?

Current state: 5 units in inventory, customer can add 17 to cart (no reservation enforced).
If two customers simultaneously add the last 5 units to their carts, both can proceed to checkout.
This creates overselling.

### Decision needed:
**Option A (Simple):** No reservation. Stock check only at order creation. First to complete checkout wins.
Show live available stock on frontend.

**Option B (Reservation):** Reserve stock on "add to cart". Release after TTL (e.g. 30 min) if not purchased.
More complex, prevents overselling.

### Minimum fix regardless of which option:
- Frontend must show current available stock
- At order creation (server-side), validate: `requested_qty <= available_stock`
- Return clear error if stock is insufficient at checkout time

---

## FINAL CHECKLIST

After all fixes, verify:

[ ] Cart: adding more than stock shows toast "Maksimal miqdor: X ta", + button disabled at limit
[ ] Cart: server rejects quantity > stock with 400 error
[ ] Product page: shows correct stock badge (MAVJUD / Kam qoldi / Tugadi)
[ ] Sales "Koreya" filter: shows 40,000 ₩, 1 order
[ ] Sales "O'zbekiston" filter: shows 0 (correct, no UZB orders)
[ ] Sales product performance table: shows Dokdo Cream row
[ ] Dashboard 7-day chart: shows a bar for May 4
[ ] Chart dates: no off-by-one, consistent timezone
[ ] Profile page: no sevimlilar tab
[ ] Product cards: no heart icons
[ ] Product detail: no heart icon, no star rating, no "sharhlar" count
[ ] Inventory status column: shows "Kam qoldi" when at/below threshold, not "In Stock"
