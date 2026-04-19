# CLAUDE.md — NuraSkin Project Rules

> **Read this file before every significant change.**
> This is the single source of truth for how this codebase is built.
> Rules here override personal style and default Claude Code behavior.

---

## 1. Project Context

**NuraSkin** is a Korean cosmetics e-commerce platform targeting Uzbekistan.
The founder (based in Daejeon, Korea) ships products from Korea to Uzbekistan.
The system has three apps and shared libraries managed in an **Nx monorepo**.

| Fact | Value |
|---|---|
| Tenancy | Single client — no `tenant_id` anywhere in schema |
| Launch language | Uzbek (Latin); i18n keys structured for RU/KO as translation files later |
| Target scale (year 1) | ~10k products · ~1k active customers · 3–5 admin users |
| Deployment | Single Ubuntu 22.04 VPS + Docker + Nginx |

---

## 2. Tech Stack — Locked

| Layer | Choice | Do NOT substitute |
|---|---|---|
| Monorepo | Nx + pnpm | No Turborepo, no Yarn, no Lerna |
| Backend | Node 20 + Express + TypeScript | No NestJS, no Fastify, no plain JS |
| ORM | **Drizzle** | No Prisma, no TypeORM |
| Database | PostgreSQL 16 | No MongoDB, no SQLite (dev or prod) |
| Cache / Queue | Redis 7 + BullMQ | No RabbitMQ, no SQS |
| Admin UI | React 19 + Vite + TanStack Router + TanStack Query + Zustand | No Next.js for admin |
| Frontend UI | React 19 + Vite + TanStack Router + TanStack Query + Zustand | Not a Next.js / SSR app |
| Styling | Tailwind v4 + Shadcn UI (defaults) | No CSS-in-JS, no styled-components |
| Forms | React Hook Form + Zod resolver | No Formik |
| Icons | Lucide React | No mixing other icon sets |
| Charts | Recharts | No Chart.js |
| Logging | Pino | No Winston, no `console.log` in committed code |
| Testing | Vitest + Supertest + Playwright | **No Jest** — Jest is not used in this project |
| Auth | JWT (admin) + Telegram Login Widget (frontend) | No Auth0, no NextAuth |
| Payments | Manual receipt upload only (v1) | No payment gateway in v1 |
| Storage | Cloudinary | No alternative until justified |

Library scope: `@nura/*`

---

## 3. Folder Structure

```
nura/
├── apps/
│   ├── admin/          ← Admin SPA (React + Vite)
│   ├── frontend/       ← Customer storefront SPA (React + Vite)
│   └── server/         ← Express API server
├── libs/
│   ├── database/       ← Drizzle schema, migrations, seeds, db client
│   ├── types/          ← Shared TypeScript types and Zod schemas
│   ├── ui/             ← Shared React components (@nura/ui)
│   └── api-client/     ← Typed API client used by both SPAs
├── infra/
│   └── docker/         ← docker-compose.yml for local dev
└── .agents/            ← Claude Code agent definitions
```

### Folder rules

1. **Never create empty module folders ahead of time.** Folders exist only when they contain real files.
2. **Apps vs. Libs:** App-specific code lives in `apps/`. Shared domain logic, UI components, and utilities live in `libs/`.
3. **Co-locate tests** with source: `auth.service.ts` + `auth.service.spec.ts` in the same folder.
4. **No barrel files** (`index.ts` re-exporting everything) inside app domains. Only `libs/*` export via standard Nx `index.ts` entry points.

---

## 4. Backend Layer Rules (Express)

Request flow — **never skip layers:**

```
routes → controllers → services → repositories → drizzle → database
```

| Layer | Can import | Cannot import |
|---|---|---|
| routes | controllers, schema, middleware | services, repositories, drizzle |
| controllers | services, schema, errors | repositories, drizzle |
| services | other services, repositories, infrastructure, errors | express, req, res (**NEVER**) |
| repositories | drizzle, schema | services, controllers, express |

**Hard rules:**

- Services are framework-agnostic. No `express` import. Ever.
- Controllers are thin: parse → call service → respond. Max ~15 lines per handler.
- Every `POST` / `PUT` / `PATCH` validates input with a Zod schema.
- Every error is a typed subclass of `AppError`. Never `throw new Error('...')` or raw strings.
- Money values: `bigint` in smallest unit (UZS tiyin / KRW won / USD cents). Currency stored as a separate column.
- No `console.log` — use Pino via `req.log` or imported `logger`.

---

## 5. Frontend Rules (Admin + Frontend)

| Concern | Solution | Never use |
|---|---|---|
| Server state | TanStack Query | Zustand or `useState` for API responses |
| Client state | Zustand (one store per concern: auth, theme, ui) | — |
| Forms | React Hook Form + Zod | `useState` for ≥3 fields |
| URL state | Router search params | Component state for filters / pagination / sort |
| Data fetching | `@nura/api-client` | `fetch()` directly in components |

- Components **≤ 120 lines**. Extract sub-components or hooks if larger.
- Dark mode + mobile must work from day one — not retrofitted.

---

## 6. Design System Rules (Tailwind v4 + Shadcn UI)

### 6.1 Colors & Components

- **Use Shadcn UI defaults.** Rely entirely on the default Shadcn UI component library.
- **Tailwind v4 is CSS-first.** There is **no `tailwind.config.js`** — do not create or modify one.
- Use standard Tailwind utility classes (`bg-white`, `text-gray-900`, `p-4`) or Shadcn's semantic classes (`bg-primary`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`).
- **No custom overrides.** Do not create custom CSS variable files or bespoke theme files.

### 6.2 Spacing, Radii, Shadows

- Use the standard Tailwind scale: `p-4`, `rounded-lg`, `shadow-md`.
- No magic values: ~~`p-[13px]`~~, ~~`rounded-[7px]`~~.

### 6.3 Typography

- `Inter` via `@fontsource-variable/inter`.
- Standard Tailwind sizes: `text-xs | sm | base | lg | xl | 2xl | 3xl | 4xl`.

### 6.4 Responsive Breakpoints

- Mobile-first. Use `md:` and `lg:` to adjust up.
- **Frontend:** must be pixel-perfect at 375px (iPhone SE).
- **Admin:** functional ≥ 768px, polished ≥ 1024px.

### 6.5 Replacement Rule

When replacing a component:
1. Delete the old version in the same commit.
2. Grep for all references and update every call site.
3. No two versions of the same navbar / filter / layout may exist in the tree simultaneously.

---

## 7. Database Rules

All database code lives in `libs/database/`.

- **Every table has:** `id` (uuid pk, default `gen_random_uuid()`), `created_at` (timestamptz), `updated_at` (timestamptz).
- **Soft delete** only where needed: `products`, `categories`. Orders and ledger entries are **never** deleted.
- **Append-only tables** (no `UPDATE` or `DELETE`, ever):
  - `stock_movements`, `ledger_entries`, `order_status_history`
  - `activity_logs`, `pick_pack_audit`, `debt_transactions`
  - Use reversing entries to correct mistakes.
- **Money:** `bigint` (minor units) + separate `currency` column (`KRW` | `USD` | `UZS`).
- **Migrations are immutable** once shipped. Never edit a committed migration — write a new one.
- **Seeds are idempotent.** Safe to run twice.
- **Indexes:** every FK has an index; every common `WHERE` / `JOIN` / `ORDER BY` column is indexed.

---

## 8. Domain Rules — Locked Decisions

### 8.1 Debt Limit (Qarz)

Effective limit per user = `users.debt_limit_override ?? settings.debt_limit_default`

| `outstanding_debt / effective_limit` | Behavior |
|---|---|
| `< 80%` | Normal checkout |
| `80–99%` | Soft warning banner; checkout allowed; Telegram nudge to user |
| `100–119%` | Frontend blocks checkout; admin gets Telegram alert; admin can override |
| `≥ 120%` | Hard block everywhere; only `orders:override_debt_limit` permission bypasses; every override logged |

### 8.2 Pick & Pack Barcode Fallback

- **Primary:** camera barcode scan via `@zxing/browser`.
- **Fallback:** manual entry of the last 6 digits of SKU + Confirm button.
- Every action writes to `pick_pack_audit` (append-only).
- System **never blocks shipment** for a missing barcode — manual fallback always works. **Reliability > strictness.**

### 8.3 Payments

- Manual receipt upload only in v1 (image uploaded via frontend).
- Admin verifies via Orders tab; on confirm, order moves to `PAID`.
- On reject, order returns to `PENDING_PAYMENT` with admin's note shown to customer.

### 8.4 UZ Price Calculation

```
uz_price =
  base_export_price_usd × current_uzs_per_usd_rate
  + (weight_grams / 1000) × cargo_rate_usd_per_kg × current_uzs_per_usd_rate
```

> `current_uzs_per_usd_rate` is read from the most recent **rate snippet** — NOT from a live API call at request time.

### 8.5 Order State Machine

```
DRAFT → PENDING_PAYMENT → PAID → PACKING → SHIPPED → DELIVERED
  ↓            ↓
CANCELED    CANCELED   (auto-restock blocked if SHIPPED)
                ↓
            REFUNDED
```

---

## 9. Testing Rules

- Every service has unit tests: happy path + edge cases + error cases.
- Every route has an integration test (real Express + test DB).
- Critical flows have Playwright E2E: login, pick-and-pack, rate snippet lock, checkout.
- Tests co-locate with source files.
- `nx affected:test` must be green before every commit.
- No `it.skip` committed without a linked TODO comment.

---

## 10. Git & Commit Rules

- **Conventional commits:** `feat:` `fix:` `chore:` `refactor:` `docs:` `test:` `perf:`
- **One logical change per commit.** Split if diff > 300 lines across unrelated areas.
- **Branch naming:** `feat/short-description`, `fix/short-description`

---

## 11. Security Rules

- All env vars Zod-validated at boot. **Crash on invalid env** — never silently fall back.
- All mutation routes: auth middleware + permission check.
- All user-supplied IDs validated as UUID before any DB query.
- Rate-limit `POST` routes (≥ 10 req / min / user).
- Receipt uploads: validate MIME type + file size + image dimensions; store via Cloudinary signed upload.

---

## 12. Claude Code — How You Work Here

### 12.1 Before Any Change

1. Read this file (`CLAUDE.md`).
2. Grep the codebase for existing patterns before writing new ones.

### 12.2 When Writing

- Match existing patterns. **Consistency > cleverness.**
- Small diffs > big rewrites.
- No speculative abstraction. Build for today's requirements only.

### 12.3 When Replacing UI

1. Grep for **all** imports of the old component.
2. Replace all call sites in the same commit.
3. Delete the old file.

### 12.4 When Done with a Task

1. Run `nx affected:typecheck`
2. Run `nx affected:test`
3. Summarize: files changed, user-visible difference, any follow-ups required.

### 12.5 Forbidden Behaviors

| ❌ | Why |
|---|---|
| Empty folders with `.gitkeep` "for structure" | Violates rule 3.1 |
| `any` types to silence TypeScript | Masks real bugs |
| Duplicate components / layouts in the tree | Violates rule 6.5 |
| Inventing new custom CSS variables or token files | Violates rule 6.1 |
| Creating or editing `tailwind.config.js` | Does not exist in Tailwind v4 |
| `console.log` in committed code | Use Pino |
| Using Jest in any form | This project uses Vitest only |
| Editing shipped migrations | Migrations are immutable |
| DB calls in controllers | Violates layer rules (§4) |
| Business logic in controllers | Violates layer rules (§4) |
| `req` / `res` in services | Services must be framework-agnostic |
| Writing code outside the folder specified in the task | Stay in scope |

---

## 13. Performance Budgets

| Metric | Budget |
|---|---|
| Admin initial JS bundle | < 300 KB gzip |
| Frontend landing LCP (mobile, 4G) | < 2.5 s |
| API p95 latency (simple queries) | < 150 ms |
| DB query p95 (dashboard aggregates) | < 500 ms |

---

## 14. Glossary (Uzbek Terms Used in Code)

| Term | Meaning |
|---|---|
| **Qarz** | Debt / outstanding balance owed to NuraSkin |
| **Sof foyda** | Net profit |
| **Tan narx** | Cost price (before cargo) |
| **Done narx** | Single-unit retail price |
| **Optom narx** | Wholesale price |
| **Yuborildi** | Shipped |
| **Rate snippet** | Locked KRW/USD/UZS exchange rate captured at batch purchase time |
| **Bunch / Batch** | Single wholesale purchase from Korea (multiple SKUs together) |