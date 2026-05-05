-- One-time data fix: backfill null timestamps on orders that were manually
-- set to terminal statuses via Drizzle Studio without going through the service.
-- Run ONCE against the production DB after deploying the 0028 migration.

-- Fix DELIVERED orders missing timestamps
UPDATE orders
SET
  delivered_at   = COALESCE(delivered_at, updated_at, created_at),
  shipped_at     = COALESCE(shipped_at,   updated_at, created_at),
  packed_at      = COALESCE(packed_at,    updated_at, created_at),
  payment_verified_at = COALESCE(payment_verified_at, payment_submitted_at, updated_at, created_at)
WHERE status = 'DELIVERED'
  AND delivered_at IS NULL;

-- Fix SHIPPED orders missing shipped_at
UPDATE orders
SET
  shipped_at  = COALESCE(shipped_at, packed_at, updated_at, created_at),
  packed_at   = COALESCE(packed_at,  updated_at, created_at)
WHERE status = 'SHIPPED'
  AND shipped_at IS NULL;

-- Fix PACKING orders missing packed_at (best guess)
UPDATE orders
SET
  payment_verified_at = COALESCE(payment_verified_at, payment_submitted_at, updated_at, created_at)
WHERE status IN ('PAID', 'PACKING', 'PAYMENT_VERIFIED')
  AND payment_verified_at IS NULL;
