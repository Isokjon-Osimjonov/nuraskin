ALTER TABLE "settings" ADD COLUMN "kor_bank_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_bank_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_bank_holder" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_bank_number" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_e9pay_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_e9pay_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "kor_e9pay_account" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_bank_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_bank_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_bank_holder" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_bank_number" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_e9pay_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_e9pay_name" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "uzb_e9pay_account" text;