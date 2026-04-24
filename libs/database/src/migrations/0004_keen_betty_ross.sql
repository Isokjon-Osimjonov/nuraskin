ALTER TABLE "products" ADD COLUMN "how_to_use_uz" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "skin_types" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "benefits" jsonb DEFAULT '[]'::jsonb NOT NULL;