CREATE TABLE "daily_sales_summary" (
	"date" date NOT NULL,
	"region_code" text NOT NULL,
	"product_id" uuid NOT NULL,
	"units_sold" integer DEFAULT 0 NOT NULL,
	"revenue_krw" bigint DEFAULT 0 NOT NULL,
	"cogs_krw" bigint DEFAULT 0 NOT NULL,
	"cargo_krw" bigint DEFAULT 0 NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_sales_summary_date_region_code_product_id_pk" PRIMARY KEY("date","region_code","product_id")
);
--> statement-breakpoint
ALTER TABLE "daily_sales_summary" ADD CONSTRAINT "daily_sales_summary_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_sales_date" ON "daily_sales_summary" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_daily_sales_region" ON "daily_sales_summary" USING btree ("region_code");