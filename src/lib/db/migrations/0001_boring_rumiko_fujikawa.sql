CREATE TABLE "client_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"payment_rating" integer,
	"communication_rating" integer,
	"clarity_rating" integer,
	"would_work_again" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_client_review" UNIQUE("job_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"professional_title" varchar(200),
	"bio" text,
	"hourly_rate" varchar(50),
	"availability" varchar(50) DEFAULT 'available' NOT NULL,
	"years_of_experience" integer DEFAULT 0 NOT NULL,
	"languages" jsonb DEFAULT '[]' NOT NULL,
	"timezone" varchar(50),
	"portfolio_url" text,
	"linkedin_url" text,
	"github_url" text,
	"verification_status" varchar(50) DEFAULT 'unverified' NOT NULL,
	"total_jobs" integer DEFAULT 0 NOT NULL,
	"total_earnings" varchar(50) DEFAULT '0' NOT NULL,
	"avg_rating" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 100 NOT NULL,
	"response_time" integer,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"communication_rating" integer,
	"quality_rating" integer,
	"deadline_rating" integer,
	"skills_rating" jsonb DEFAULT '{}' NOT NULL,
	"would_hire_again" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"response" text,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_freelancer_review" UNIQUE("job_id","freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "freelancer_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"years_of_experience" integer DEFAULT 0 NOT NULL,
	"skill_level" varchar(20) DEFAULT 'intermediate' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"endorsements" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_freelancer_skill" UNIQUE("freelancer_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "job_bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"bid_amount" varchar(50) NOT NULL,
	"delivery_days" integer NOT NULL,
	"proposal_text" text NOT NULL,
	"cover_letter" text,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"milestones" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_job_bid" UNIQUE("job_id","freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"parent_category_id" integer,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"message" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_job_invitation" UNIQUE("job_id","freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "job_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"amount" varchar(50) NOT NULL,
	"due_date" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"submission_url" text,
	"submission_note" text,
	"feedback" text,
	"escrow_milestone_id" integer,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category_id" integer NOT NULL,
	"budget_type" varchar(20) NOT NULL,
	"budget_min" varchar(50),
	"budget_max" varchar(50),
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"deadline" timestamp,
	"skills_required" jsonb DEFAULT '[]' NOT NULL,
	"experience_level" varchar(50) DEFAULT 'intermediate' NOT NULL,
	"project_duration" varchar(50),
	"visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"escrow_id" integer,
	"chain_id" integer,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"freelancer_id" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category_id" integer,
	"skills_used" jsonb DEFAULT '[]' NOT NULL,
	"project_url" text,
	"images" jsonb DEFAULT '[]' NOT NULL,
	"completion_date" timestamp,
	"client_name" varchar(100),
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_freelancers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_saved_freelancer" UNIQUE("client_id","freelancer_id")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_saved_job" UNIQUE("freelancer_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category_id" integer,
	"description" text,
	"icon" varchar(50),
	"is_verifiable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_categories" ADD CONSTRAINT "job_categories_parent_category_id_job_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD CONSTRAINT "job_milestones_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_freelancers" ADD CONSTRAINT "saved_freelancers_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_freelancers" ADD CONSTRAINT "saved_freelancers_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_reviews_job" ON "client_reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_client" ON "client_reviews" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_reviewer" ON "client_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_user" ON "freelancer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_availability" ON "freelancer_profiles" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_rating" ON "freelancer_profiles" USING btree ("avg_rating");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_job" ON "freelancer_reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_freelancer" ON "freelancer_reviews" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_reviewer" ON "freelancer_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_freelancer" ON "freelancer_skills" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_skill" ON "freelancer_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_job" ON "job_bids" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_freelancer" ON "job_bids" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_status" ON "job_bids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_categories_slug" ON "job_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_job_categories_parent" ON "job_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE INDEX "idx_job_invitations_job" ON "job_invitations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_invitations_freelancer" ON "job_invitations" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_job" ON "job_milestones" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_status" ON "job_milestones" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_postings_client" ON "job_postings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_job_postings_category" ON "job_postings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_job_postings_status" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_postings_visibility" ON "job_postings" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_job_postings_freelancer" ON "job_postings" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_portfolio_items_freelancer" ON "portfolio_items" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_portfolio_items_category" ON "portfolio_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_saved_freelancers_client" ON "saved_freelancers" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_saved_jobs_freelancer" ON "saved_jobs" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_skills_category" ON "skills" USING btree ("category_id");