ALTER TABLE "order_items" ADD COLUMN "negotiated_price_krw" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_source" varchar(20) DEFAULT 'STOREFRONT' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_amount" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmed_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee_charged" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee_actual" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_covered_by" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_confirmed_by_users_id_fk" FOREIGN KEY ("payment_confirmed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_check" CHECK ("orders"."order_source" IN ('STOREFRONT', 'MANUAL'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_check" CHECK ("orders"."payment_method" IN ('TELEGRAM_TRANSFER', 'CASH', 'BANK_TRANSFER', 'CARD'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_covered_check" CHECK ("orders"."delivery_covered_by" IN ('CUSTOMER', 'BUSINESS'));