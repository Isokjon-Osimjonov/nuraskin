CREATE TABLE "kor_shipping_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_order_krw" bigint,
	"cargo_fee_krw" bigint NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

INSERT INTO "kor_shipping_tiers" ("max_order_krw", "cargo_fee_krw", "sort_order") VALUES
(100000, 4000, 1),
(200000, 8000, 2),
(300000, 6000, 3),
(null, 0, 4);
--> statement-breakpoint

ALTER TABLE "product_regional_configs" DROP CONSTRAINT "product_regional_configs_currency_check";
--> statement-breakpoint

UPDATE "product_regional_configs" SET "currency" = 'KRW';
--> statement-breakpoint

ALTER TABLE "product_regional_configs" ALTER COLUMN "currency" SET DEFAULT 'KRW';
--> statement-breakpoint

ALTER TABLE "exchange_rate_snapshots" ADD COLUMN "krw_to_uzs" integer DEFAULT 9 NOT NULL;
--> statement-breakpoint

ALTER TABLE "exchange_rate_snapshots" ADD COLUMN "cargo_rate_krw_per_kg" integer DEFAULT 10000 NOT NULL;
--> statement-breakpoint

ALTER TABLE "settings" ADD COLUMN "min_order_uzb_uzs" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE "settings" ADD COLUMN "min_order_kor_krw" bigint DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE "exchange_rate_snapshots" DROP COLUMN "usd_to_uzs";
--> statement-breakpoint

ALTER TABLE "exchange_rate_snapshots" DROP COLUMN "usd_to_krw";
--> statement-breakpoint

ALTER TABLE "exchange_rate_snapshots" DROP COLUMN "cargo_rate_usd_per_kg";
--> statement-breakpoint

ALTER TABLE "product_regional_configs" ADD CONSTRAINT "product_regional_configs_currency_check" CHECK ("product_regional_configs"."currency" IN ('UZS', 'KRW'));
--> statement-breakpoint

INSERT INTO "exchange_rate_snapshots" ("krw_to_uzs", "cargo_rate_krw_per_kg", "note") VALUES (9, 10000, 'Migration to KRW base pricing');
