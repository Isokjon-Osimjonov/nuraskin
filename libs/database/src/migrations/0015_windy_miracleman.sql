ALTER TABLE "telegram_posts" ADD COLUMN "show_krw_retail" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD COLUMN "show_krw_wholesale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD COLUMN "show_uzs_retail" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD COLUMN "show_uzs_wholesale" boolean DEFAULT false NOT NULL;--> statement-breakpoint

DO $$
BEGIN
    -- Check if the old columns exist before attempting to migrate data and drop them
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'telegram_posts' AND column_name = 'show_krw_price'
    ) THEN
        -- Migrate existing data
        UPDATE "telegram_posts" SET 
            "show_krw_retail" = "show_krw_price",
            "show_uzs_retail" = "show_uzs_price";
            
        -- Drop old columns
        ALTER TABLE "telegram_posts" DROP COLUMN "show_krw_price";
        ALTER TABLE "telegram_posts" DROP COLUMN "show_uzs_price";
    END IF;
END $$;
