CREATE TABLE "bid_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"proposal_text" text NOT NULL,
	"cover_letter" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer,
	"parent_id" integer,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0,
	"is_approved" boolean DEFAULT false,
	"is_spam" boolean DEFAULT false,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"featured_image" varchar(500),
	"category" varchar(50) NOT NULL,
	"tags" jsonb,
	"author_id" integer NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"seo_keywords" text,
	"og_image" varchar(500),
	"read_time" integer,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft',
	"published_at" timestamp,
	"is_featured" boolean DEFAULT false,
	"allow_comments" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "delivery_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"milestone_id" integer,
	"package_name" varchar(200) NOT NULL,
	"description" text,
	"files" jsonb DEFAULT '[]' NOT NULL,
	"delivered_by" integer NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"delivery_note" text,
	"acceptance_note" text,
	"signature" text,
	"signed_by" integer,
	"delivered_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"job_id" integer,
	"milestone_id" integer,
	"invoice_id" integer,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"type" varchar(50) DEFAULT 'milestone' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"available_at" timestamp,
	"platform_fee" varchar(50),
	"net_amount" varchar(50) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"order_index" integer DEFAULT 0,
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "faq_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"tags" jsonb,
	"related_faqs" jsonb,
	"view_count" integer DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"order_index" integer DEFAULT 0,
	"is_highlighted" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "faq_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faq_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"faq_id" integer NOT NULL,
	"user_id" integer,
	"session_id" varchar(100),
	"is_helpful" boolean NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "file_annotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_version_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"coordinates" jsonb,
	"page_number" integer,
	"line_number" integer,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"parent_annotation_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_file_id" integer,
	"attachment_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"filename" text NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"uploaded_by" integer NOT NULL,
	"change_description" text,
	"is_latest" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_file_version" UNIQUE("original_file_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "help_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"category" varchar(50) NOT NULL,
	"subcategory" varchar(50),
	"tags" jsonb,
	"related_articles" jsonb,
	"search_keywords" text,
	"view_count" integer DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"author_id" integer,
	"last_reviewed_at" timestamp,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "help_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"bid_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"meeting_type" varchar(50) DEFAULT 'video' NOT NULL,
	"meeting_link" varchar(500),
	"location" text,
	"notes" text,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"client_confirmed" boolean DEFAULT true NOT NULL,
	"freelancer_confirmed" boolean DEFAULT false NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"cancelled_by" integer,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"job_id" integer NOT NULL,
	"milestone_id" integer,
	"freelancer_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"due_date" timestamp,
	"paid_at" timestamp,
	"payment_method" varchar(50),
	"transaction_hash" varchar(100),
	"description" text,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"tax_amount" varchar(50),
	"discount_amount" varchar(50),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "job_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"saved_search_id" integer,
	"job_id" integer NOT NULL,
	"alert_type" varchar(50) DEFAULT 'new_match' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_job_alert" UNIQUE("user_id","job_id","alert_type")
);
--> statement-breakpoint
CREATE TABLE "job_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"milestone_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'todo' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"assigned_to" integer,
	"created_by" integer NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" integer,
	"actual_hours" integer,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"message" text NOT NULL,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"milestone_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"response_note" text,
	"responded_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"step_id" integer NOT NULL,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"started_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"step_order" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"target_element" varchar(255),
	"position" varchar(20) DEFAULT 'auto',
	"content" jsonb,
	"required_action" varchar(100),
	"xp_reward" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "onboarding_steps_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "partner_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"paid_at" timestamp,
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(500),
	"partner_type" varchar(50) NOT NULL,
	"tier" varchar(20) NOT NULL,
	"commission_rate" numeric(5, 2),
	"custom_terms" jsonb,
	"api_key" varchar(255),
	"webhook_url" varchar(500),
	"branding" jsonb,
	"total_revenue" numeric(10, 2) DEFAULT '0',
	"total_referrals" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"approved_at" timestamp,
	"approved_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partners_email_unique" UNIQUE("email"),
	CONSTRAINT "partners_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "payment_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"reminder_type" varchar(50) NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"scheduled_for" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_drafts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "referral_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"reward_type" varchar(50) NOT NULL,
	"referrer_reward" jsonb NOT NULL,
	"referee_reward" jsonb NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"conditions" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_link_id" integer NOT NULL,
	"referrer_id" integer NOT NULL,
	"referee_id" integer NOT NULL,
	"campaign_id" integer,
	"conversion_type" varchar(50) NOT NULL,
	"referrer_reward_status" varchar(20) DEFAULT 'pending',
	"referee_reward_status" varchar(20) DEFAULT 'pending',
	"referrer_reward_amount" jsonb,
	"referee_reward_amount" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"converted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_id" integer,
	"code" varchar(100) NOT NULL,
	"custom_alias" varchar(100),
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"total_earnings" numeric(10, 2) DEFAULT '0',
	"metadata" jsonb,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_links_code_unique" UNIQUE("code"),
	CONSTRAINT "referral_links_custom_alias_unique" UNIQUE("custom_alias")
);
--> statement-breakpoint
CREATE TABLE "reputation_nfts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nft_type" varchar(50) NOT NULL,
	"token_id" bigint NOT NULL,
	"metadata_uri" text,
	"reputation_level" varchar(20),
	"minted_at" timestamp DEFAULT now() NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"chain_id" integer DEFAULT 1 NOT NULL,
	"contract_address" varchar(42),
	CONSTRAINT "reputation_nfts_token_id_unique" UNIQUE("token_id"),
	CONSTRAINT "reputation_nfts_tx_hash_unique" UNIQUE("tx_hash"),
	CONSTRAINT "unique_user_nft_level" UNIQUE("user_id","nft_type","reputation_level")
);
--> statement-breakpoint
CREATE TABLE "reputation_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"average_rating" varchar(5) DEFAULT '0' NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"is_freelancer" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_reputation" UNIQUE("user_id","is_freelancer")
);
--> statement-breakpoint
CREATE TABLE "review_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"review_type" varchar(20) NOT NULL,
	"disputed_by" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"evidence" jsonb DEFAULT '[]' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"resolution" varchar(20),
	"admin_note" text,
	"action_taken" varchar(50),
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"search_type" varchar(50) DEFAULT 'jobs' NOT NULL,
	"filters" jsonb DEFAULT '{}' NOT NULL,
	"query" text,
	"alerts_enabled" boolean DEFAULT false NOT NULL,
	"alert_frequency" varchar(50) DEFAULT 'daily',
	"last_alert_sent" timestamp,
	"results_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_endorsements" (
	"id" serial PRIMARY KEY NOT NULL,
	"endorser_id" integer NOT NULL,
	"endorsed_user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"relationship" varchar(50),
	"project_context" text,
	"verified" boolean DEFAULT false NOT NULL,
	"job_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_skill_endorsement" UNIQUE("endorser_id","endorsed_user_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "social_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"platform" varchar(50) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" integer NOT NULL,
	"share_url" text,
	"custom_message" text,
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"year" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_url" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"tax_info" jsonb DEFAULT '{}' NOT NULL,
	"total_earnings" varchar(50),
	"total_tax_withheld" varchar(50),
	"generated_at" timestamp,
	"sent_at" timestamp,
	"acknowledged_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_tax_document" UNIQUE("user_id","year","document_type")
);
--> statement-breakpoint
CREATE TABLE "time_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"milestone_id" integer,
	"task_id" integer,
	"user_id" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"description" text,
	"is_billable" boolean DEFAULT true NOT NULL,
	"hourly_rate" varchar(50),
	"total_amount" varchar(50),
	"status" varchar(50) DEFAULT 'tracked' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"invoice_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tooltip_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"placement" varchar(20) DEFAULT 'top',
	"trigger_type" varchar(20) DEFAULT 'hover',
	"category" varchar(50),
	"is_rich_content" boolean DEFAULT false,
	"show_once" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tooltip_content_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tutorial_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tutorial_id" integer NOT NULL,
	"current_step" integer DEFAULT 0,
	"completed_steps" jsonb DEFAULT '[]',
	"completed_at" timestamp,
	"started_at" timestamp DEFAULT now(),
	"last_accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"estimated_time" integer,
	"steps" jsonb NOT NULL,
	"prerequisites" jsonb,
	"xp_reward" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"is_interactive" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tutorials_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "verification_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_type" varchar(50) NOT NULL,
	"verification_level" varchar(20) NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"verification_method" varchar(100),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_verification_badge" UNIQUE("user_id","badge_type")
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"watched_seconds" integer DEFAULT 0,
	"completed_at" timestamp,
	"last_watched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_tutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"thumbnail_url" varchar(500),
	"video_url" varchar(500) NOT NULL,
	"embed_code" text,
	"duration" integer,
	"category" varchar(50) NOT NULL,
	"tags" jsonb,
	"transcript" text,
	"chapters" jsonb,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"xp_reward" integer DEFAULT 0,
	"order_index" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"method" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"destination_account" text NOT NULL,
	"transaction_id" varchar(100),
	"fee" varchar(50),
	"net_amount" varchar(50) NOT NULL,
	"processed_at" timestamp,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_type" varchar(50) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"location" text,
	"meeting_link" text,
	"attendees" jsonb DEFAULT '[]' NOT NULL,
	"created_by" integer NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"reminder_minutes" integer,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"current_tab" varchar(50),
	"metadata" jsonb,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	CONSTRAINT "workspace_sessions_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "unique_active_workspace_session" UNIQUE("job_id","user_id","status")
);
--> statement-breakpoint
ALTER TABLE "job_bids" ADD COLUMN "shortlisted_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_bids" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_bids" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD COLUMN "auto_release_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD COLUMN "disputed_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "avg_bid_amount" varchar(50);--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "featured_until" timestamp;--> statement-breakpoint
ALTER TABLE "bid_templates" ADD CONSTRAINT "bid_templates_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parent_id_blog_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_delivered_by_users_id_fk" FOREIGN KEY ("delivered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_categories" ADD CONSTRAINT "faq_categories_parent_id_faq_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faq_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_votes" ADD CONSTRAINT "faq_votes_faq_id_faq_items_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_votes" ADD CONSTRAINT "faq_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_file_version_id_file_versions_id_fk" FOREIGN KEY ("file_version_id") REFERENCES "public"."file_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_bid_id_job_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."job_bids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_chats" ADD CONSTRAINT "milestone_chats_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_chats" ADD CONSTRAINT "milestone_chats_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_revisions" ADD CONSTRAINT "milestone_revisions_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_revisions" ADD CONSTRAINT "milestone_revisions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_step_id_onboarding_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."onboarding_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_drafts" ADD CONSTRAINT "profile_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referral_link_id_referral_links_id_fk" FOREIGN KEY ("referral_link_id") REFERENCES "public"."referral_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_campaign_id_referral_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."referral_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_campaign_id_referral_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."referral_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_nfts" ADD CONSTRAINT "reputation_nfts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_registry" ADD CONSTRAINT "reputation_registry_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_disputes" ADD CONSTRAINT "review_disputes_disputed_by_users_id_fk" FOREIGN KEY ("disputed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_disputes" ADD CONSTRAINT "review_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorser_id_users_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorsed_user_id_users_id_fk" FOREIGN KEY ("endorsed_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_milestone_id_job_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."job_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_task_id_job_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."job_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_progress" ADD CONSTRAINT "tutorial_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_progress" ADD CONSTRAINT "tutorial_progress_tutorial_id_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."tutorials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_video_tutorials_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video_tutorials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_events" ADD CONSTRAINT "workspace_events_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_events" ADD CONSTRAINT "workspace_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_sessions" ADD CONSTRAINT "workspace_sessions_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_sessions" ADD CONSTRAINT "workspace_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bid_templates_freelancer" ON "bid_templates" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_bid_templates_default" ON "bid_templates" USING btree ("freelancer_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_job" ON "delivery_packages" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_milestone" ON "delivery_packages" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_delivered_by" ON "delivery_packages" USING btree ("delivered_by");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_status" ON "delivery_packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_earnings_freelancer" ON "earnings" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_job" ON "earnings" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_milestone" ON "earnings" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_status" ON "earnings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_earnings_available_at" ON "earnings" USING btree ("available_at");--> statement-breakpoint
CREATE UNIQUE INDEX "faq_votes_user_faq_idx" ON "faq_votes" USING btree ("user_id","faq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faq_votes_session_faq_idx" ON "faq_votes" USING btree ("session_id","faq_id");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_file" ON "file_annotations" USING btree ("file_version_id");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_user" ON "file_annotations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_status" ON "file_annotations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_parent" ON "file_annotations" USING btree ("parent_annotation_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_original" ON "file_versions" USING btree ("original_file_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_attachment" ON "file_versions" USING btree ("attachment_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_job" ON "file_versions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_uploaded_by" ON "file_versions" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_file_versions_latest" ON "file_versions" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "idx_interviews_job" ON "interviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_bid" ON "interviews" USING btree ("bid_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_client" ON "interviews" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_freelancer" ON "interviews" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_scheduled" ON "interviews" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_interviews_status" ON "interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_freelancer" ON "invoices" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_client" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_job" ON "invoices" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_milestone" ON "invoices" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_user" ON "job_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_search" ON "job_alerts" USING btree ("saved_search_id");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_job" ON "job_alerts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_status" ON "job_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_job" ON "job_tasks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_milestone" ON "job_tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_assigned" ON "job_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_status" ON "job_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_priority" ON "job_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_due_date" ON "job_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_milestone" ON "milestone_chats" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_sender" ON "milestone_chats" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_created" ON "milestone_chats" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_milestone" ON "milestone_revisions" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_requested_by" ON "milestone_revisions" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_status" ON "milestone_revisions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_progress_user_step_idx" ON "onboarding_progress" USING btree ("user_id","step_id");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_invoice" ON "payment_reminders" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_recipient" ON "payment_reminders" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_scheduled" ON "payment_reminders" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_status" ON "payment_reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_profile_drafts_user" ON "profile_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_user" ON "reputation_nfts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_type" ON "reputation_nfts" USING btree ("nft_type");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_token" ON "reputation_nfts" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_user" ON "reputation_registry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_score" ON "reputation_registry" USING btree ("reputation_score");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_freelancer" ON "reputation_registry" USING btree ("is_freelancer");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_review" ON "review_disputes" USING btree ("review_id","review_type");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_disputed_by" ON "review_disputes" USING btree ("disputed_by");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_status" ON "review_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_created" ON "review_disputes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_user" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_type" ON "saved_searches" USING btree ("search_type");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_alerts" ON "saved_searches" USING btree ("alerts_enabled");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_endorsed_user" ON "skill_endorsements" USING btree ("endorsed_user_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_endorser" ON "skill_endorsements" USING btree ("endorser_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_skill" ON "skill_endorsements" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_verified" ON "skill_endorsements" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_user" ON "tax_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_year" ON "tax_documents" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_type" ON "tax_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_job" ON "time_tracking" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_milestone" ON "time_tracking" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_task" ON "time_tracking" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_user" ON "time_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_status" ON "time_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_date" ON "time_tracking" USING btree ("start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_progress_user_tutorial_idx" ON "tutorial_progress" USING btree ("user_id","tutorial_id");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_user" ON "verification_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_type" ON "verification_badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_active" ON "verification_badges" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "video_progress_user_video_idx" ON "video_progress" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_freelancer" ON "withdrawals" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_status" ON "withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_created" ON "withdrawals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_job" ON "workspace_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_type" ON "workspace_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_start" ON "workspace_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_created_by" ON "workspace_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_job" ON "workspace_sessions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_user" ON "workspace_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_status" ON "workspace_sessions" USING btree ("status");