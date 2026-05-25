ALTER TABLE "coupons" ADD COLUMN "is_promotional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "is_first_purchase_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "promo_display_text" text;