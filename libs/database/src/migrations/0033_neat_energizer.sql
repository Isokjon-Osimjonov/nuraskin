ALTER TABLE "coupons" DROP CONSTRAINT "coupons_type_check";--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "exclude_wholesale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_type_check" CHECK ("coupons"."type" IN ('PERCENTAGE', 'FIXED', 'FREE_SHIPPING'));