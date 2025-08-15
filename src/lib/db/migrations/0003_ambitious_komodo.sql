ALTER TABLE "escrow_listings" ADD COLUMN "job_posting_id" integer;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "service_title" varchar(200);--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "service_description" text;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "service_category_id" integer;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "delivery_time_days" integer;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "revisions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD COLUMN "skills_offered" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "job_posting_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "bid_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "milestone_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_system_message" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "job_posting_id" integer;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "bid_id" integer;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "milestone_id" integer;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "deliverables" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "revision_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "freelancer_delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "client_approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "dispute_reason" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "disputed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_game_data" ADD COLUMN "freelancer_stats" jsonb DEFAULT '{"jobsCompleted": 0, "totalEarnings": "0", "avgRating": 0, "onTimeDelivery": 0, "repeatClients": 0}' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_game_data" ADD COLUMN "freelancer_achievements" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_game_data" ADD COLUMN "freelancer_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_game_data" ADD COLUMN "freelancer_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD CONSTRAINT "escrow_listings_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD CONSTRAINT "escrow_listings_service_category_id_job_categories_id_fk" FOREIGN KEY ("service_category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_bid_id_job_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."job_bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_job_posting_id_job_postings_id_fk" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_bid_id_job_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."job_bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_job_posting" ON "escrow_listings" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_service_category" ON "escrow_listings" USING btree ("service_category_id");--> statement-breakpoint
CREATE INDEX "idx_messages_job_posting" ON "messages" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_messages_bid" ON "messages" USING btree ("bid_id");--> statement-breakpoint
CREATE INDEX "idx_trades_job_posting" ON "trades" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_trades_bid" ON "trades" USING btree ("bid_id");--> statement-breakpoint
CREATE INDEX "idx_trades_milestone" ON "trades" USING btree ("milestone_id");