CREATE TABLE "order_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"box_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_boxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"max_weight_grams" integer NOT NULL,
	"tare_weight_grams" integer NOT NULL,
	"cost_price_krw" bigint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_boxes" ADD CONSTRAINT "order_boxes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_boxes" ADD CONSTRAINT "order_boxes_box_id_shipping_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."shipping_boxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_boxes_order_id_idx" ON "order_boxes" USING btree ("order_id");