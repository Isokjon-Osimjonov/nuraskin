CREATE TABLE "telegram_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"chat_type" varchar(20) NOT NULL,
	"language" varchar(5) DEFAULT 'UZB' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_channels_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_post_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"message_id" bigint,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "telegram_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"post_type" varchar(30) DEFAULT 'PRODUCT_SHOWCASE' NOT NULL,
	"language" varchar(5) DEFAULT 'UZB' NOT NULL,
	"caption_text" text DEFAULT '' NOT NULL,
	"image_urls" jsonb DEFAULT '[]' NOT NULL,
	"hashtags" jsonb DEFAULT '[]' NOT NULL,
	"cta_type" varchar(20) DEFAULT 'BUY_NOW' NOT NULL,
	"cta_custom_text" text,
	"show_krw_price" boolean DEFAULT false NOT NULL,
	"show_uzs_price" boolean DEFAULT true NOT NULL,
	"promo_price_uzs" bigint,
	"telegram_url" text,
	"instagram_url" text,
	"website_url" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_channels" ADD CONSTRAINT "telegram_channels_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_post_channels" ADD CONSTRAINT "telegram_post_channels_post_id_telegram_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."telegram_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_post_channels" ADD CONSTRAINT "telegram_post_channels_channel_id_telegram_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."telegram_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_channels_chat_id_idx" ON "telegram_channels" USING btree ("chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_post_channels_unique_idx" ON "telegram_post_channels" USING btree ("post_id","channel_id");