DROP INDEX "idx_escrow_listings_job_posting";--> statement-breakpoint
DROP INDEX "idx_escrow_listings_service_category";--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "posting_type" varchar(20) DEFAULT 'job' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "service_price" varchar(50);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "price_per_unit" varchar(50);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "delivery_time" integer;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "revisions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "payment_methods" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_job_postings_type" ON "job_postings" USING btree ("posting_type");--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "job_posting_id";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "service_title";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "service_description";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "service_category_id";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "delivery_time_days";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "revisions";--> statement-breakpoint
ALTER TABLE "escrow_listings" DROP COLUMN "skills_offered";