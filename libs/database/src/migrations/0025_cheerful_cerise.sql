ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_type_check";--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "price_snapshot" bigint DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "region_code" text DEFAULT 'UZB' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_type_check" CHECK ("stock_movements"."movement_type" IN ('STOCK_IN', 'RESERVED', 'RESERVATION_RELEASED', 'DEDUCTED', 'ADJUSTED', 'RETURNED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'));