ALTER TABLE "coupons" ADD COLUMN "value_uzs" bigint;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "value_krw" bigint;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "max_discount_uzs" bigint;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "max_discount_krw" bigint;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "min_order_uzs" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "min_order_krw" bigint DEFAULT 0;