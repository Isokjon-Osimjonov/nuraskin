CREATE TABLE "product_regional_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"region_code" varchar(5) NOT NULL,
	"retail_price" bigint NOT NULL,
	"wholesale_price" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"min_wholesale_qty" integer DEFAULT 5 NOT NULL,
	"min_order_qty" integer DEFAULT 1 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_regional_configs_region_check" CHECK ("product_regional_configs"."region_code" IN ('UZB', 'KOR')),
	CONSTRAINT "product_regional_configs_currency_check" CHECK ("product_regional_configs"."currency" IN ('USD', 'UZS', 'KRW'))
);
--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_ref" varchar(100),
	"initial_qty" integer NOT NULL,
	"current_qty" integer NOT NULL,
	"cost_price" bigint NOT NULL,
	"cost_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"expiry_date" date,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_batches_initial_qty_check" CHECK ("inventory_batches"."initial_qty" > 0),
	CONSTRAINT "inventory_batches_current_qty_check" CHECK ("inventory_batches"."current_qty" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"order_id" uuid,
	"movement_type" varchar(25) NOT NULL,
	"quantity_delta" integer NOT NULL,
	"qty_before" integer NOT NULL,
	"qty_after" integer NOT NULL,
	"performed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_type_check" CHECK ("stock_movements"."movement_type" IN ('STOCK_IN', 'RESERVED', 'RESERVATION_RELEASED', 'DEDUCTED', 'ADJUSTED', 'RETURNED'))
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_reservations_status_check" CHECK ("stock_reservations"."status" IN ('ACTIVE', 'RELEASED', 'CONVERTED'))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint,
	"phone" varchar(20),
	"full_name" varchar(255) NOT NULL,
	"region_code" varchar(5) DEFAULT 'UZB' NOT NULL,
	"debt_limit_override" bigint,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "exchange_rate_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usd_to_uzs" bigint NOT NULL,
	"usd_to_krw" bigint NOT NULL,
	"cargo_rate_usd_per_kg" integer NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_limit_default" bigint NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"admin_card_number" varchar(50),
	"admin_card_holder" varchar(100),
	"admin_card_bank" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price_snapshot" bigint NOT NULL,
	"subtotal_snapshot" bigint NOT NULL,
	"currency_snapshot" varchar(3) NOT NULL,
	"is_scanned" boolean DEFAULT false NOT NULL,
	"scanned_at" timestamp with time zone,
	"scanned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" varchar(25),
	"to_status" varchar(25) NOT NULL,
	"changed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_id" uuid NOT NULL,
	"region_code" varchar(5) NOT NULL,
	"status" varchar(25) DEFAULT 'DRAFT' NOT NULL,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"cargo_fee" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(3) NOT NULL,
	"total_weight_grams" integer DEFAULT 0 NOT NULL,
	"rate_snapshot_id" uuid,
	"payment_receipt_url" text,
	"payment_submitted_at" timestamp with time zone,
	"payment_verified_at" timestamp with time zone,
	"payment_verified_by" uuid,
	"payment_rejected_at" timestamp with time zone,
	"payment_note" text,
	"tracking_number" varchar(100),
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"packed_by" uuid,
	"packed_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" IN ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED'))
);
--> statement-breakpoint
CREATE TABLE "pick_pack_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"performed_by" uuid NOT NULL,
	"action" varchar(30) NOT NULL,
	"scan_input" varchar(100),
	"expected_barcode" varchar(50),
	"result" varchar(10) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_pack_audit_action_check" CHECK ("pick_pack_audit"."action" IN ('SCAN_SUCCESS', 'SCAN_MISMATCH', 'MANUAL_FALLBACK', 'ITEM_CONFIRMED', 'ORDER_PACKED')),
	CONSTRAINT "pick_pack_audit_result_check" CHECK ("pick_pack_audit"."result" IN ('OK', 'ERROR'))
);
--> statement-breakpoint
ALTER TABLE "category_products" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "category_products" CASCADE;--> statement-breakpoint
DROP INDEX "products_deleted_idx";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_uz" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_regional_configs" ADD CONSTRAINT "product_regional_configs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate_snapshots" ADD CONSTRAINT "exchange_rate_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_rate_snapshot_id_exchange_rate_snapshots_id_fk" FOREIGN KEY ("rate_snapshot_id") REFERENCES "public"."exchange_rate_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_verified_by_users_id_fk" FOREIGN KEY ("payment_verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_packed_by_users_id_fk" FOREIGN KEY ("packed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_pack_audit" ADD CONSTRAINT "pick_pack_audit_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_pack_audit" ADD CONSTRAINT "pick_pack_audit_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_pack_audit" ADD CONSTRAINT "pick_pack_audit_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_regional_configs_product_region_idx" ON "product_regional_configs" USING btree ("product_id","region_code");--> statement-breakpoint
CREATE INDEX "product_regional_configs_product_id_idx" ON "product_regional_configs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_batches_product_id_idx" ON "inventory_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_batches_received_at_idx" ON "inventory_batches" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "inventory_batches_expiry_date_idx" ON "inventory_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_batch_id_idx" ON "stock_movements" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "stock_movements_order_id_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_order_item_id_idx" ON "stock_reservations" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_batch_id_idx" ON "stock_reservations" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_product_id_idx" ON "stock_reservations" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_telegram_id_idx" ON "customers" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_region_code_idx" ON "customers" USING btree ("region_code");--> statement-breakpoint
CREATE INDEX "customers_is_active_idx" ON "customers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "exchange_rate_snapshots_created_by_idx" ON "exchange_rate_snapshots" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "exchange_rate_snapshots_created_at_idx" ON "exchange_rate_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_batch_id_idx" ON "order_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_created_at_idx" ON "order_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pick_pack_audit_order_id_idx" ON "pick_pack_audit" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "pick_pack_audit_order_item_id_idx" ON "pick_pack_audit" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "pick_pack_audit_performed_by_idx" ON "pick_pack_audit" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "pick_pack_audit_created_at_idx" ON "pick_pack_audit" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_brand_name_idx" ON "products" USING btree ("brand_name");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_deleted_at_idx" ON "products" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");