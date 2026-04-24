# NuraSkin Project Context & Guidelines

NuraSkin is a Korean cosmetics e-commerce platform targeting Uzbekistan, managed as an Nx monorepo.

## Project Overview

- **Core Mission:** Facilitate Korean cosmetics sales in Uzbekistan with localized language (Uzbek Latin) and logistics (Korea to Uzbekistan shipping).
- **Architecture:** 
  - **Apps:** `admin` (Admin SPA), `frontend` (Customer Storefront), `server` (Express API).
  - **Libs:** `database` (Drizzle schema/client), `shared-types` (Zod schemas), `ui` (Shared React components), `validation` (Shared validation logic).
- **Tech Stack:**
  - **Monorepo:** Nx + pnpm.
  - **Backend:** Node 20, Express, TypeScript, Drizzle ORM, PostgreSQL 16, Redis/BullMQ.
  - **Frontend:** React 19, Vite, TanStack Router, TanStack Query, Zustand, Tailwind v4, Shadcn UI.
  - **Testing:** Vitest, Playwright.

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Docker (for local infra)

### Commands
- **Install:** `pnpm install`
- **Infra (Postgres/Redis):** `npm run infra:up`
- **Start Apps:**
  - `npx nx serve admin`
  - `npx nx serve frontend`
  - `npx nx serve server`
- **Build:** `npx nx build <project>`
- **Test:** `npx nx test <project>`
- **Lint:** `npx nx lint <project>`
- **Typecheck:** `npx nx typecheck <project>`

## Development Guidelines

### Backend Layering (Express)
Follow the strict request flow:
`routes → controllers → services → repositories → drizzle → database`
- **Services:** Framework-agnostic (no Express imports).
- **Controllers:** Thin (< 15 lines), parse request -> call service -> respond.
- **Validation:** Every mutation route must validate input with Zod.
- **Errors:** Use typed subclasses of `AppError`.
- **Logging:** Use Pino via `req.log`. No `console.log`.

### Frontend Patterns
- **Server State:** TanStack Query.
- **Client State:** Zustand (one store per concern).
- **Forms:** React Hook Form + Zod.
- **Styling:** Tailwind v4 (CSS-first, no `tailwind.config.js`). Use Shadcn UI defaults.
- **Responsive:** Mobile-first (iPhone SE 375px baseline).

### Database (Drizzle)
- Tables must have: `id` (UUID), `created_at`, `updated_at`.
- Money: Use `bigint` (minor units like UZS tiyin) + `currency` column.
- Migrations: Immutable once committed.
- Soft Delete: Only for `products` and `categories`.

### Domain Specifics
- **Qarz (Debt Limit):** Tiered behavior based on debt usage percentage (80%, 100%, 120%).
- **Price Calculation:** Derived from base export price (USD) + cargo weight + exchange rate snippet.
- **Order Flow:** `DRAFT → PENDING_PAYMENT → PAID → PACKING → SHIPPED → DELIVERED`.

## AI Interaction Protocol

### Before Any Change
1. Read `CLAUDE.md` and `GEMINI.md`.
2. Grep for existing patterns; consistency over cleverness.
3. Verify directory/file existence before proposing changes.

### When Writing Code
- **No Barrel Files:** Inside app domains, avoid `index.ts` re-exports.
- **Co-locate Tests:** Keep `.spec.ts` files next to their source.
- **Types:** Avoid `any`. Use strict TypeScript.
- **DRY Libs:** Move shared logic to `libs/`.

### Validation
Always run before completion:
1. `npx nx affected:typecheck`
2. `npx nx affected:test`
