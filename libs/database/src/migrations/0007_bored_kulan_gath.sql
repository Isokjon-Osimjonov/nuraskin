ALTER TABLE "products" ADD COLUMN "show_stock_count" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD COLUMN "expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "payment_timeout_minutes" integer DEFAULT 30 NOT NULL;