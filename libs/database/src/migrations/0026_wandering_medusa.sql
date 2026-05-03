CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"region_code" text NOT NULL,
	"label" text DEFAULT 'Manzil' NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"uzb_region" text,
	"uzb_city" text,
	"uzb_street" text,
	"kor_postal_code" text,
	"kor_road_address" text,
	"kor_detail" text,
	"kor_building" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_addresses_region_code_check" CHECK ("customer_addresses"."region_code" IN ('UZB', 'KOR'))
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_full_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_address_line1" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_address_line2" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_city" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_postal_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_region_code" text;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customer_addresses_customer_id" ON "customer_addresses" USING btree ("customer_id");