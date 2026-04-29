ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "telegram_url" varchar(200);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(200);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "website_url" varchar(200);

ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "show_cta" boolean DEFAULT false NOT NULL;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "cta_text" varchar(100);
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "cta_url" text;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "show_admin_phone" boolean DEFAULT false NOT NULL;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "admin_phone" varchar(20);

ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link1_show" boolean DEFAULT false NOT NULL;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link1_text" varchar(50);
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link1_url" text;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link2_show" boolean DEFAULT false NOT NULL;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link2_text" varchar(50);
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link2_url" text;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link3_show" boolean DEFAULT false NOT NULL;
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link3_text" varchar(50);
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "link3_url" text;

DO $$
BEGIN
    -- Check if the old columns exist before attempting to migrate data and drop them
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'telegram_posts' AND column_name = 'telegram_url'
    ) THEN
        -- Migrate existing data
        UPDATE "telegram_posts" SET 
            "show_cta" = false,
            "link1_show" = true, 
            "link1_text" = 'Telegram', 
            "link1_url" = "telegram_url",
            "link2_show" = true, 
            "link2_text" = 'Instagram', 
            "link2_url" = "instagram_url",
            "link3_show" = true, 
            "link3_text" = 'Website',   
            "link3_url" = "website_url"
        WHERE "telegram_url" IS NOT NULL OR "instagram_url" IS NOT NULL OR "website_url" IS NOT NULL;
            
        -- Drop old columns
        ALTER TABLE "telegram_posts" DROP COLUMN "cta_type";
        ALTER TABLE "telegram_posts" DROP COLUMN "cta_custom_text";
        ALTER TABLE "telegram_posts" DROP COLUMN "telegram_url";
        ALTER TABLE "telegram_posts" DROP COLUMN "instagram_url";
        ALTER TABLE "telegram_posts" DROP COLUMN "website_url";
    END IF;
END $$;
