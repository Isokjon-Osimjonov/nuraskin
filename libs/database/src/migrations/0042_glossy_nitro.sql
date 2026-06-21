UPDATE coupons
SET first_order_only = true
WHERE is_first_purchase_only = true
  AND first_order_only = false;

ALTER TABLE "coupons" DROP COLUMN "is_first_purchase_only";