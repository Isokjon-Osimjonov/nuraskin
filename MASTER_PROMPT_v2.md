# NuraSkin WMS — Master Implementation Prompt (v2)
> Paste this into Claude Code or Gemini at the start of each phase.
> Read CLAUDE.md before every session. These rules override everything.

---

## LOCKED DECISIONS

| Decision | Choice | Reason |
|---|---|---|
| Barcode scanner | `@zxing/browser` | Locked in CLAUDE.md §8.2 |
| Brands | **No brands table** | AI fills brand_name as a plain text field on products |
| Product name | **Single `name` field** | Same name for KOR and UZB — Korean cosmetic names are not translated |
| AI provider | OpenAI GPT-4o Vision | Env var: `OPENAI_API_KEY` |
| Payment v1 | Manual receipt upload | Frontend already implemented. Admin panel confirms/rejects. |

---

## REMOVED FROM SCHEMA
- ~~`brands` table~~ — deleted entirely
- ~~`brand_id` FK on products~~ — replaced by `brand_name varchar(100)`
- ~~`name_uz` / `name_kr`~~ — replaced by single `name varchar(255)` field
  (product names like "Lacto-Fit", "SPF 50+" are NOT translated — same in all regions)

---

## ENV VARIABLES REQUIRED (add to .env and Zod env validator)
```
OPENAI_API_KEY=sk-...
```
Validate at boot — crash if missing per CLAUDE.md §11.

---

## PHASE 1 — Database Foundation (Drizzle Schema + Migrations)

All tables go in `libs/database/src/schema/`. One file per domain.
Run `nx affected:typecheck` after every migration.

---

### 1.1 — `products`
```ts
id             uuid         PK   default gen_random_uuid()
barcode        varchar(50)  NOT NULL  UNIQUE   -- EAN-13 from Korean factory
sku            varchar(50)  NOT NULL  UNIQUE   -- internal code, last 6 digits = manual fallback
name           varchar(255) NOT NULL           -- ONE field, same for KOR and UZB, written in Uzbek
                                               -- e.g. "Lacto-Fit Collagen" — NOT translated
brand_name     varchar(100) NOT NULL           -- AI-extracted from image, editable by admin
category_id    uuid         FK → categories(id)  ON DELETE RESTRICT
description_uz text         nullable           -- AI-generated, in Uzbek
weight_grams   integer      NOT NULL  default 0
image_urls     jsonb        NOT NULL  default '[]'  -- Cloudinary URLs, array
is_active      boolean      NOT NULL  default true
deleted_at     timestamptz  nullable            -- soft delete
created_at     timestamptz  NOT NULL  default now()
updated_at     timestamptz  NOT NULL  default now()
```
Indexes: `barcode`, `sku`, `brand_name`, `category_id`, `deleted_at`

---

### 1.2 — `product_regional_configs`
ONE ROW PER (product × region). Never hardcode region columns.
```ts
id                  uuid       PK   default gen_random_uuid()
product_id          uuid       FK → products(id)  ON DELETE CASCADE
region_code         varchar(5) NOT NULL  CHECK (region_code IN ('UZB', 'KOR'))

retail_price        bigint     NOT NULL   -- done narx, minor units
wholesale_price     bigint     NOT NULL   -- optom narx, minor units
currency            varchar(3) NOT NULL   CHECK (currency IN ('USD', 'UZS', 'KRW'))

min_wholesale_qty   integer    NOT NULL  default 5   -- UZB: maybe 10, KOR: maybe 3
min_order_qty       integer    NOT NULL  default 1

is_available        boolean    NOT NULL  default true
created_at          timestamptz NOT NULL default now()
updated_at          timestamptz NOT NULL default now()

UNIQUE(product_id, region_code)
```

---

### 1.3 — `inventory_batches`
FIFO = ORDER BY received_at ASC at query time.
```ts
id              uuid        PK   default gen_random_uuid()
product_id      uuid        FK → products(id)  ON DELETE RESTRICT
batch_ref       varchar(100) nullable   -- factory batch number
initial_qty     integer     NOT NULL  CHECK (initial_qty > 0)
current_qty     integer     NOT NULL  CHECK (current_qty >= 0)
cost_price      bigint      NOT NULL   -- tan narx, minor units
cost_currency   varchar(3)  NOT NULL  default 'USD'
expiry_date     date        nullable
received_at     timestamptz NOT NULL  default now()
notes           text        nullable
created_at      timestamptz NOT NULL  default now()
updated_at      timestamptz NOT NULL  default now()
```
Indexes: `product_id`, `received_at`, `expiry_date`

---

### 1.4 — `stock_movements` (APPEND-ONLY — no UPDATE or DELETE ever)
```ts
id              uuid        PK   default gen_random_uuid()
batch_id        uuid        FK → inventory_batches(id)
product_id      uuid        FK → products(id)
order_id        uuid        nullable  FK → orders(id)

movement_type   varchar(25) NOT NULL
  -- STOCK_IN | RESERVED | RESERVATION_RELEASED | DEDUCTED | ADJUSTED | RETURNED

quantity_delta  integer     NOT NULL   -- positive = added, negative = removed
qty_before      integer     NOT NULL
qty_after       integer     NOT NULL
performed_by    uuid        nullable  FK → admin_users(id)
note            text        nullable
created_at      timestamptz NOT NULL  default now()
```
Indexes: `product_id`, `batch_id`, `order_id`, `movement_type`, `created_at`

---

### 1.5 — `stock_reservations`
Soft-lock stock when order reaches PENDING_PAYMENT.
```ts
id              uuid        PK   default gen_random_uuid()
order_id        uuid        FK → orders(id)  ON DELETE CASCADE
order_item_id   uuid        FK → order_items(id)  ON DELETE CASCADE
batch_id        uuid        FK → inventory_batches(id)
product_id      uuid        FK → products(id)
quantity        integer     NOT NULL
status          varchar(20) NOT NULL  default 'ACTIVE'
  -- ACTIVE | RELEASED | CONVERTED
created_at      timestamptz NOT NULL  default now()
updated_at      timestamptz NOT NULL  default now()
```

---

### 1.6 — `customers`
```ts
id                   uuid        PK   default gen_random_uuid()
telegram_id          bigint      UNIQUE  nullable
phone                varchar(20) nullable
full_name            varchar(255) NOT NULL
region_code          varchar(5)  NOT NULL  default 'UZB'
debt_limit_override  bigint      nullable   -- null = use settings.debt_limit_default
notes                text        nullable
is_active            boolean     NOT NULL  default true
created_at           timestamptz NOT NULL  default now()
updated_at           timestamptz NOT NULL  default now()
```

---

### 1.7 — `orders`
```ts
id                  uuid        PK   default gen_random_uuid()
order_number        varchar(20) NOT NULL  UNIQUE   -- NS-20240424-0001
customer_id         uuid        FK → customers(id)  ON DELETE RESTRICT
region_code         varchar(5)  NOT NULL   -- snapshot of customer region at order time

status              varchar(25) NOT NULL  default 'DRAFT'
  -- DRAFT → PENDING_PAYMENT → PAID → PACKING → SHIPPED → DELIVERED
  -- DRAFT | PENDING_PAYMENT → CANCELED
  -- PAID → REFUNDED

subtotal            bigint      NOT NULL  default 0
cargo_fee           bigint      NOT NULL  default 0
total_amount        bigint      NOT NULL  default 0
currency            varchar(3)  NOT NULL
total_weight_grams  integer     NOT NULL  default 0

rate_snapshot_id    uuid        nullable  FK → exchange_rate_snapshots(id)

-- Payment (manual receipt flow)
payment_receipt_url text        nullable   -- Cloudinary URL uploaded by customer
payment_submitted_at timestamptz nullable  -- when customer submitted receipt
payment_verified_at  timestamptz nullable  -- when admin confirmed
payment_verified_by  uuid        nullable  FK → admin_users(id)
payment_rejected_at  timestamptz nullable
payment_note        text        nullable   -- admin rejection reason shown to customer

-- Shipping
tracking_number     varchar(100) nullable
shipped_at          timestamptz  nullable
delivered_at        timestamptz  nullable

-- Packing
packed_by           uuid        nullable  FK → admin_users(id)
packed_at           timestamptz nullable

admin_note          text        nullable
created_at          timestamptz NOT NULL  default now()
updated_at          timestamptz NOT NULL  default now()
```
Indexes: `order_number`, `customer_id`, `status`, `created_at`

---

### 1.8 — `order_items`
```ts
id                  uuid        PK   default gen_random_uuid()
order_id            uuid        FK → orders(id)  ON DELETE CASCADE
product_id          uuid        FK → products(id)  ON DELETE RESTRICT
batch_id            uuid        nullable  FK → inventory_batches(id)   -- set during PACKING

quantity            integer     NOT NULL  CHECK (quantity > 0)

-- PRICE SNAPSHOT — frozen at order creation, never recalculated
unit_price_snapshot bigint      NOT NULL
subtotal_snapshot   bigint      NOT NULL
currency_snapshot   varchar(3)  NOT NULL

-- Pick & Pack scan tracking
is_scanned          boolean     NOT NULL  default false
scanned_at          timestamptz nullable
scanned_by          uuid        nullable  FK → admin_users(id)

created_at          timestamptz NOT NULL  default now()
updated_at          timestamptz NOT NULL  default now()
```

---

### 1.9 — `order_status_history` (APPEND-ONLY)
```ts
id          uuid        PK   default gen_random_uuid()
order_id    uuid        FK → orders(id)
from_status varchar(25) nullable
to_status   varchar(25) NOT NULL
changed_by  uuid        nullable  FK → admin_users(id)
note        text        nullable
created_at  timestamptz NOT NULL  default now()
```

---

### 1.10 — `exchange_rate_snapshots` (rate snippets)
Newest row = current rate. Admin creates new rows, never edits old ones.
```ts
id                     uuid    PK   default gen_random_uuid()
usd_to_uzs             bigint  NOT NULL   -- e.g. 12600 (integer UZS per 1 USD)
usd_to_krw             bigint  NOT NULL   -- e.g. 1340
cargo_rate_usd_per_kg  integer NOT NULL   -- stored as USD cents, e.g. 1000 = $10
note                   text    nullable
created_by             uuid    nullable  FK → admin_users(id)
created_at             timestamptz NOT NULL  default now()
```

---

### 1.11 — `settings` (single-row table)
```ts
id                   uuid    PK   default gen_random_uuid()
debt_limit_default   bigint  NOT NULL
low_stock_threshold  integer NOT NULL  default 10
admin_card_number    varchar(50) nullable   -- payment card number shown to customers
admin_card_holder    varchar(100) nullable  -- card holder name shown to customers
admin_card_bank      varchar(100) nullable  -- bank name
created_at           timestamptz NOT NULL  default now()
updated_at           timestamptz NOT NULL  default now()
```
Seed with one row on first run.

---

### 1.12 — `pick_pack_audit` (APPEND-ONLY)
```ts
id               uuid        PK   default gen_random_uuid()
order_id         uuid        FK → orders(id)
order_item_id    uuid        FK → order_items(id)
performed_by     uuid        FK → admin_users(id)
action           varchar(30) NOT NULL
  -- SCAN_SUCCESS | SCAN_MISMATCH | MANUAL_FALLBACK | ITEM_CONFIRMED | ORDER_PACKED
scan_input       varchar(100) nullable
expected_barcode varchar(50)  nullable
result           varchar(10)  NOT NULL   -- OK | ERROR
note             text         nullable
created_at       timestamptz  NOT NULL  default now()
```

---

### Phase 1 Completion Checklist
- [ ] All schema files in `libs/database/src/schema/`
- [ ] Drizzle index.ts exports all tables
- [ ] Migration generated and applied
- [ ] Seed: one `settings` row, one `exchange_rate_snapshots` row
- [ ] `nx affected:typecheck` passes

---

## PHASE 2 — Products CRUD with AI Image Analysis

### 2.1 — AI Analyzer Endpoint
```
POST /api/products/analyze-image
Body: { image_url: string }   -- Cloudinary URL already uploaded
Auth: admin only

Flow:
1. Call OpenAI GPT-4o with the image URL + system prompt below
2. Return structured JSON to admin frontend
3. Admin reviews, edits if needed, then saves

OpenAI call:
  model: "gpt-4o"
  messages: [
    {
      role: "system",
      content: `You are a Korean cosmetics product analyst.
                Analyze the product image and return JSON ONLY.
                Rules:
                - name: product name as it appears on packaging, written in Latin script (do not translate).
                  Example: "Lacto-Fit Collagen 50 Sticks", "Beauty of Joseon SPF 50+"
                - brand_name: brand name as it appears on packaging, in original script or Latin.
                - description_uz: 2-3 sentence product description in Uzbek language.
                  Describe what the product is, its main benefits, and how to use it.
                  Write naturally for an Uzbek-speaking customer.
                Return exactly: { "name": "...", "brand_name": "...", "description_uz": "..." }
                Return ONLY the JSON object, no markdown, no extra text.`
    },
    {
      role: "user",
      content: [{ type: "image_url", image_url: { url: image_url } }]
    }
  ]
  max_tokens: 400

4. Parse JSON response
5. Return { name, brand_name, description_uz } to frontend
```

**Error handling:**
- If OpenAI returns unparseable JSON → return `{ error: 'AI_PARSE_FAILED' }`, frontend shows manual entry
- If OpenAI API call fails → return `{ error: 'AI_UNAVAILABLE' }`, never crash product creation flow
- Never block product creation if AI fails — it's a convenience feature only

### 2.2 — Products API Endpoints
```
GET    /api/products              — paginated list, filter by category/is_active, search by name/barcode/sku/brand_name
GET    /api/products/:id          — full detail including regional_configs and stock summary
GET    /api/products/barcode/:barcode  — scanner lookup
POST   /api/products              — create product + both regional_configs in one DB transaction
PATCH  /api/products/:id          — update product core fields
PATCH  /api/products/:id/regional-config/:region  — update one region's pricing
DELETE /api/products/:id          — soft delete
POST   /api/products/analyze-image — AI analysis (see 2.1)
```

### 2.3 — Zod Validation Schema
```ts
CreateProductSchema {
  barcode:        string, min 8, max 50
  sku:            string, min 3, max 50
  name:           string, min 2, max 255     -- single name field
  brand_name:     string, min 1, max 100
  category_id:    uuid
  description_uz: string, optional
  weight_grams:   number, positive integer
  image_urls:     string[], max 8 items
  regional_configs: array of exactly 2 items [
    {
      region_code:        'UZB' | 'KOR'
      retail_price:       number (converted to bigint cents in service)
      wholesale_price:    number
      currency:           'USD' | 'UZS' | 'KRW'
      min_wholesale_qty:  number, min 1
      min_order_qty:      number, min 1
    }
  ]
}
```

### 2.4 — Admin UI: Products List Page (`/products`)
Table columns: Thumbnail, Name, Brand, Category, Weight, UZB price, KOR price, Stock, Status, Actions
Filters (URL search params): category_id, is_active, search text

### 2.5 — Admin UI: Product Create/Edit Form
```
Layout:
  Left column (60%):
    - Image upload (Cloudinary, drag & drop or phone camera)
    - After first image uploaded: "✨ Fill with AI" button appears
      → Calls POST /api/products/analyze-image
      → Shows loading spinner with text "Analyzing product..."
      → On success: fills name, brand_name, description_uz fields
      → Toast: "AI filled the fields. Please review before saving."
      → Fields remain editable — admin must review
    - name input (label: "Product Name")
    - brand_name input (label: "Brand")
    - description_uz textarea (label: "Description (Uzbek)")

  Right column (40%):
    - barcode input
    - sku input
    - category_id select
    - weight_grams number input

  Bottom section — two tabs: "O'zbekiston" | "Koreya"
    Each tab:
      - retail_price + currency
      - wholesale_price
      - min_wholesale_qty
      - min_order_qty
```

**UX rules for AI fill:**
- "Fill with AI" button: disabled if no image uploaded yet
- After AI fills fields: highlight filled fields with a subtle ring color for 3 seconds so admin notices what changed
- If AI fails: show toast "AI tahlil qila olmadi. Qo'lda to'ldiring." (cannot analyze, fill manually)
- Admin can always edit AI-filled fields before saving

### Phase 2 Completion Checklist
- [ ] `OPENAI_API_KEY` added to env schema + Zod validator
- [ ] ProductAnalyzerService with OpenAI GPT-4o Vision call
- [ ] ProductsRepository, ProductsService, ProductsController, products.routes
- [ ] Zod schema in libs/types
- [ ] Admin: Products list + create/edit form with AI fill button
- [ ] Unit tests: ProductsService + ProductAnalyzerService (mock OpenAI)
- [ ] `nx affected:typecheck` and `nx affected:test` pass

---

## PHASE 3 — Warehouse In-Stocking with Barcode Scanner

### 3.1 — Install
```bash
pnpm add @zxing/browser @zxing/library --filter @nuraskin/admin
```

### 3.2 — BarcodeScanner Component (`libs/ui/src/scanner/BarcodeScanner.tsx`)
```
Props: onScan(barcode: string), onError?(err: Error), isActive: boolean

Implementation:
  - Use BrowserMultiFormatReader from @zxing/browser
  - Camera constraint: { facingMode: 'environment' }  (back camera)
  - On mount: start continuous scanning
  - On unmount: call reader.reset() — critical to avoid camera staying on
  - On successful decode: navigator.vibrate(200) then call onScan(result.getText())
  - Debounce: ignore same barcode scanned within 1500ms
  - Torch toggle button (flashlight): use ImageCapture API if available
  - Manual fallback input: text input + "Confirm" button (for damaged barcodes)
    → Accepts last 6 digits of SKU per CLAUDE.md §8.2
  - Error states:
    NotAllowedError → show "Kamera ruxsati rad etildi" with settings link
    NotFoundError   → show "Kamera topilmadi"
```

### 3.3 — Inventory API Endpoints
```
GET  /api/inventory/scan/:barcode       — product lookup by barcode, includes stock summary
POST /api/inventory/batches             — add new stock batch (stock-in)
GET  /api/inventory/products            — all products with total stock, low stock flagged
GET  /api/inventory/batches/:productId  — all batches for a product, FIFO order
```

### 3.4 — Stock-In Flow
```
1. Admin scans barcode
2. GET /api/inventory/scan/:barcode
   → Found: return product + current stock summary
             Frontend shows product card + "Add Batch" bottom sheet
   → Not found (404): Frontend navigates to /products/new with barcode pre-filled
     (Do NOT allow full product creation inline during a scanning session)

3. Admin fills Add Batch form:
   - quantity (integer, required)
   - cost_price (USD, required)
   - expiry_date (date, optional but show warning if empty for cosmetics)
   - batch_ref (optional)

4. POST /api/inventory/batches
   → Create inventory_batches row (current_qty = initial_qty)
   → Create stock_movements row (STOCK_IN, qty_before=0, qty_after=qty)
   → Return updated total stock

5. Vibrate 200ms. Toast "✓ 200 ta Lacto-Fit qo'shildi". Sheet closes. Camera reopens.
```

### 3.5 — Admin UI: Scan Page (`/inventory/scan`)
- Mobile-first, full-screen camera
- After scan: slide-up bottom sheet with product info + batch form
- Continuous mode: sheet closes after save, camera reopens
- Top bar: scan count for this session + "Done" button

### 3.6 — Admin UI: Inventory Overview (`/inventory`)
- Table: product thumbnail, name, brand, total stock, batches count, earliest expiry, low stock badge
- Low stock badge: red if total_stock < settings.low_stock_threshold
- Click row → batch detail for that product

### Phase 3 Completion Checklist
- [ ] BarcodeScanner component in libs/ui (vibrate, torch, debounce, manual fallback)
- [ ] InventoryRepository (includes FIFO deduction method), InventoryService, InventoryController, inventory.routes
- [ ] Admin: `/inventory/scan` mobile-first page
- [ ] Admin: `/inventory` overview page with low stock flags
- [ ] Unit tests: FIFO deduction across multiple batches
- [ ] `nx affected:typecheck` and `nx affected:test` pass

---

## PHASE 4 — Orders System, Payment Verification & Pick-Pack

### 4.1 — Admin Orders List Page (`/orders`)
```
Table columns:
  Order#, Customer, Status badge, Items count, Total, Payment receipt (thumbnail icon), Created date, Actions

Status badges (colors):
  DRAFT            → gray
  PENDING_PAYMENT  → yellow    ← most action needed here
  PAID             → blue
  PACKING          → orange
  SHIPPED          → purple
  DELIVERED        → green
  CANCELED         → red
  REFUNDED         → pink

Filters: status (multi-select pills), date range, customer search
```

### 4.2 — Admin Order Detail Page (`/orders/:id`)

**Payment Section** (shown when status = PENDING_PAYMENT):
```
Card titled "To'lov tasdiqlash" (Payment Verification):
  - Customer receipt image (full-size preview on click)
  - Submitted at: [timestamp]
  - Order total: [amount] [currency]
  - Admin card used (from settings): [card_number] — [card_holder] — [bank]
  
  Two action buttons:
    ✓ "Tasdiqlash" (Confirm)   → PATCH /api/orders/:id/status { to: 'PAID' }
    ✗ "Rad etish" (Reject)     → opens textarea for rejection note
                                 → PATCH /api/orders/:id/status { to: 'PENDING_PAYMENT', payment_note: '...' }
                                 → order stays PENDING_PAYMENT but customer sees rejection note
```

**Order Items Section** (always visible):
```
Table: product thumbnail, name, barcode, qty, unit price snapshot, subtotal, scan status badge
```

**Pack & Ship Section** (shown when status = PAID or PACKING):
```
"Buyurtmani tayyorlash boshlash" button → sets status to PACKING
Once PACKING:
  - Scanner overlay activates (BarcodeScanner component)
  - Items show scan status: ✓ green (scanned) / ○ gray (pending)
  - Scan counter: "3 / 5 skanerlandi"
  - All scanned → "Tayyorlashni yakunlash" button appears → completePacking()
```

**Status Action Buttons** (context-aware, bottom of page):
```
DRAFT           → "Buyurtmani tasdiqlash" (move to PENDING_PAYMENT)
PAID            → "Tayyorlashni boshlash", "Bekor qilish"
PACKING         → "Yakunlash" (after all scanned), "Bekor qilish"
SHIPPED         → "Yetkazildi deb belgilash"
```

### 4.3 — Order API Endpoints
```
GET    /api/orders                         — paginated list with filters
GET    /api/orders/:id                     — full detail
POST   /api/orders                         — create DRAFT
POST   /api/orders/:id/items               — add item to DRAFT
DELETE /api/orders/:id/items/:itemId        — remove from DRAFT
PATCH  /api/orders/:id/status              — advance state machine
POST   /api/orders/:id/scan-item           — scan during PACKING
POST   /api/orders/:id/complete-packing    — finalize, deduct inventory
POST   /api/orders/:id/cancel              — cancel + reverse inventory
GET    /api/orders/:id/receipt             — PDF download
```

### 4.4 — OrderService Critical Logic

**Debt Check (CLAUDE.md §8.1):**
```
effective_limit = customer.debt_limit_override ?? settings.debt_limit_default
ratio = outstanding_debt / effective_limit

< 80%:    proceed
80-99%:   proceed + flag { debt_warning: true } in response
100-119%: throw DebtLimitSoftError (frontend blocks, admin can override)
≥ 120%:  throw DebtLimitHardError (only orders:override_debt_limit permission bypasses)
```

**Price Calculation (CLAUDE.md §8.4):**
```ts
// UZB
uz_price = (retail_price_usd_cents * usd_to_uzs) +
           ((weight_grams / 1000) * cargo_rate_usd_per_kg * usd_to_uzs)

// KOR (domestic, no cargo)
kor_price = retail_price_krw  // direct KRW value

// Wholesale check per region:
if (quantity >= regional_config.min_wholesale_qty) use wholesale_price
else use retail_price

// Snapshot: store rate_snapshot_id and unit_price_snapshot on order items
// Never recalculate from current prices after order is created
```

**FIFO Reservation (on PENDING_PAYMENT):**
```
SELECT * FROM inventory_batches
WHERE product_id = $1 AND current_qty > 0
ORDER BY received_at ASC

Deduct across batches until qty satisfied.
Create stock_reservations rows (ACTIVE).
Write stock_movements (RESERVED).
THROW InsufficientStockError if total available < ordered qty.
```

**completePacking:**
```
Precondition: all order_items.is_scanned = true
For each item:
  - Resolve batch_id from ACTIVE stock_reservation
  - Set order_item.batch_id
  - Convert reservation → CONVERTED
  - Write stock_movements (DEDUCTED)
  - Decrement inventory_batches.current_qty
Update order: status → SHIPPED, packed_by, packed_at
```

**cancelOrder:**
```
If PENDING_PAYMENT or PAID:
  - Release ACTIVE stock_reservations → RELEASED
  - Write stock_movements (RESERVATION_RELEASED, positive delta)
If PAID: also write REFUNDED status transition
If SHIPPED or DELIVERED: throw CannotCancelShippedOrderError
```

**scanItem:**
```
POST /api/orders/:id/scan-item { barcode?, sku_suffix? }

1. Find matching order_item (product.barcode = scanned, is_scanned = false)
2. Match found:
   - Set is_scanned = true
   - Write pick_pack_audit (SCAN_SUCCESS)
   - Return { match: true, item }
3. No match:
   - Write pick_pack_audit (SCAN_MISMATCH)
   - Return { match: false, error: 'WRONG_PRODUCT' }
4. Already scanned:
   - Return { match: false, error: 'ALREADY_SCANNED' }

Manual fallback (sku_suffix):
  - Match last 6 chars of product.sku
  - Write pick_pack_audit (MANUAL_FALLBACK)
  - NEVER block — reliability > strictness (CLAUDE.md §8.2)
```

### Phase 4 Completion Checklist
- [ ] OrdersRepository, OrdersService, OrdersController, orders.routes
- [ ] Debt limit check (§8.1)
- [ ] Price calc with rate snapshot (§8.4)
- [ ] State machine enforced (§8.5)
- [ ] FIFO reservation + hard deduction + cancellation reversal
- [ ] pick_pack_audit writes on every scan action
- [ ] Admin: Orders list page with status filters
- [ ] Admin: Order detail with payment verification UI
- [ ] Admin: Pick & Pack scanner flow in order detail
- [ ] Unit tests: OrderService (debt, price, FIFO, cancel, state machine)
- [ ] `nx affected:typecheck` and `nx affected:test` pass

---

## PHASE 5 — PDF Receipt Generation

### 5.1 — Install (server only)
```bash
pnpm add pdfkit --filter @nuraskin/server
pnpm add -D @types/pdfkit --filter @nuraskin/server
```

### 5.2 — ReceiptService.generateOrderReceipt(orderId): Promise<Buffer>
```
PDF layout:
  HEADER:
    - "NuraSkin" text logo (styled, not image dependency)
    - "CHEK / RECEIPT" heading
    - Order Number: NS-20240424-0001
    - Sana / Date: [human readable]
    - Mijoz / Customer: [full_name], [region_code]

  ITEMS TABLE:
    Columns: №, Mahsulot nomi, Barkod, Miqdor, Narx, Jami
    Each row from order_items with price snapshots (NOT current prices)
    Footer row: Umumiy og'irlik / Total weight: X.XX kg

  TOTALS:
    Jami mahsulotlar:   [subtotal]   [currency]
    Yetkazib berish:    [cargo_fee]  [currency]
    ─────────────────────────────────────────────
    UMUMIY SUMMA:       [total]      [currency]

  FOOTER:
    Kurs / Rate: 1 USD = [usd_to_uzs] UZS  (from rate_snapshot)
    Yaratildi: [timestamp]
    nuraskin.com
```

### 5.3 — Endpoint
```
GET /api/orders/:id/receipt
Auth: admin middleware
Response: Content-Type: application/pdf
          Content-Disposition: attachment; filename="NS-XXXX.pdf"
```

### 5.4 — Admin UI
"Chek yuklab olish" button on Order Detail page.
Opens in new tab via `window.open('/api/orders/:id/receipt', '_blank')`.

### Phase 5 Completion Checklist
- [ ] pdfkit installed
- [ ] ReceiptService
- [ ] Receipt route (admin auth)
- [ ] Admin: Download button on order detail
- [ ] `nx affected:typecheck` passes

---

## PHASE 6 — Exchange Rates, Settings & Admin Card

### 6.1 — Rate Snippets Page (`/settings/rates`)
- Current active rate shown in a highlighted card at top
- Table of all past snapshots (newest first, immutable)
- "Yangi kurs kiritish" (Set New Rate) form:
  - usd_to_uzs (integer)
  - usd_to_krw (integer)
  - cargo_rate_usd_per_kg (decimal → stored as cents)
  - optional note
- Creating new row makes it the active rate

### 6.2 — Settings Page (`/settings`)
```
Editable fields:
  - debt_limit_default (USD, shown as dollars, stored as cents)
  - low_stock_threshold (integer)

Payment Card section (shown to customers when they make orders):
  - admin_card_number    (e.g. "9860 1234 5678 9012")
  - admin_card_holder    (e.g. "ISOKJON YUSUPOV")
  - admin_card_bank      (e.g. "Kapital Bank")
  These are displayed to customers in the frontend order payment page.
  Admin updates them here.
```

### Phase 6 Completion Checklist
- [ ] RatesService, RatesController, rates.routes
- [ ] SettingsService, SettingsController, settings.routes
- [ ] Admin: `/settings/rates` page
- [ ] Admin: `/settings` page with card section

---

## CROSS-CUTTING RULES (every phase)

### Money
- All prices: `bigint` minor units in DB
- API responses: serialize bigint as `string` (JSON limitation)
- Helper in `libs/types`: `toCents(n: number): bigint` and `fromCents(n: bigint): string`

### Errors (all subclass AppError)
```
NotFoundError
ValidationError
ConflictError
DebtLimitSoftError
DebtLimitHardError
InsufficientStockError
CannotCancelShippedOrderError
AIAnalysisError       ← never blocks product creation, just surfaces
```

### No console.log — Pino everywhere
### No Jest — Vitest only
### Append-only tables (never UPDATE or DELETE):
`stock_movements`, `order_status_history`, `pick_pack_audit`, `debt_transactions`

### After every phase:
```bash
npx nx affected:typecheck
npx nx affected:test
```

---

## MASTER PROMPT (paste this at Claude Code / Gemini session start)

```
You are implementing the NuraSkin WMS system. Read CLAUDE.md before doing anything.

Current state: Categories CRUD is complete. Use it as the reference pattern.
No brands table — products have a plain brand_name varchar field.
Product name is a single `name` field (same for all regions, written in Uzbek Latin).

Stack is locked (CLAUDE.md §2). Key constraints:
- ORM: Drizzle only
- Scanner: @zxing/browser (not html5-qrcode)
- Money: bigint minor units + currency column everywhere
- AI: OpenAI GPT-4o via OPENAI_API_KEY env var (image analysis, fill-with-AI feature)
- Layers: routes → controllers → services → repositories (never skip)
- Services: framework-agnostic, no Express imports
- No console.log — Pino only
- No Jest — Vitest only
- Append-only: stock_movements, order_status_history, pick_pack_audit
- Soft delete: ONLY products and categories
- Payment: manual receipt upload, admin verifies in orders section

Today's task: [INSERT PHASE NUMBER AND SPECIFIC TASK]

Before writing any code:
1. Grep existing codebase for relevant patterns
2. List every file you will create or modify
3. Wait for my confirmation before writing

After completing:
1. Run nx affected:typecheck
2. Run nx affected:test
3. Report: files changed, what works now, follow-ups needed
```
