CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"read" boolean DEFAULT false NOT NULL,
	"notification_type" varchar(50),
	"title" text,
	"message" text,
	"action_url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"rate_limit_per_hour" integer DEFAULT 1000 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"plan_id" varchar(50) DEFAULT 'free' NOT NULL,
	"is_team_plan" boolean DEFAULT false NOT NULL,
	"team_owner_id" integer,
	"subscription_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(42) NOT NULL,
	"email" varchar(255),
	"name" varchar(100),
	"password_hash" varchar(255),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"avatar_path" text,
	"location" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"metadata" text,
	"updated_by_user_id" integer,
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
CREATE TABLE "payment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" varchar(50) NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"chain_id" integer NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" varchar(50) NOT NULL,
	"subscription_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "message_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"context_type" varchar(50) NOT NULL,
	"context_id" varchar(255) NOT NULL,
	"last_read_message_id" integer,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_reads_user_id_context_type_context_id_unique" UNIQUE("user_id","context_type","context_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"context_type" varchar(50) NOT NULL,
	"context_id" varchar(255) NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"job_posting_id" integer,
	"bid_id" integer,
	"milestone_id" integer,
	"is_system_message" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievement_nfts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" varchar(50) NOT NULL,
	"token_id" integer,
	"minted_at" timestamp DEFAULT now() NOT NULL,
	"tx_hash" varchar(66),
	CONSTRAINT "achievement_nfts_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "battle_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"from_user_cp" integer NOT NULL,
	"to_user_cp" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"battle_id" integer,
	"expires_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_active_invitation" UNIQUE("from_user_id","to_user_id","status")
);
--> statement-breakpoint
CREATE TABLE "battle_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"combat_power" integer NOT NULL,
	"min_cp" integer NOT NULL,
	"max_cp" integer NOT NULL,
	"match_range" integer DEFAULT 20 NOT NULL,
	"search_started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'searching' NOT NULL,
	"matched_with_user_id" integer,
	"queue_position" integer,
	"estimated_wait_time" integer,
	CONSTRAINT "battle_queue_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "battle_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"round_number" integer NOT NULL,
	"player1_action" text DEFAULT 'attack' NOT NULL,
	"player2_action" text DEFAULT 'attack' NOT NULL,
	"player1_damage" integer DEFAULT 0 NOT NULL,
	"player2_damage" integer DEFAULT 0 NOT NULL,
	"player1_critical" boolean DEFAULT false NOT NULL,
	"player2_critical" boolean DEFAULT false NOT NULL,
	"player1_attack_count" integer DEFAULT 0 NOT NULL,
	"player2_attack_count" integer DEFAULT 0 NOT NULL,
	"player1_defend_count" integer DEFAULT 0 NOT NULL,
	"player2_defend_count" integer DEFAULT 0 NOT NULL,
	"player1_health" integer NOT NULL,
	"player2_health" integer NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_battle_round" UNIQUE("battle_id","round_number")
);
--> statement-breakpoint
CREATE TABLE "battle_session_rejections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rejected_user_id" integer,
	"session_id" varchar(100) NOT NULL,
	"reason" varchar(50) DEFAULT 'cancelled' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_session_rejection" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "battle_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"player1_health" integer DEFAULT 100 NOT NULL,
	"player2_health" integer DEFAULT 100 NOT NULL,
	"player1_actions" jsonb DEFAULT '[]' NOT NULL,
	"player2_actions" jsonb DEFAULT '[]' NOT NULL,
	"player1_energy" integer DEFAULT 0 NOT NULL,
	"player2_energy" integer DEFAULT 0 NOT NULL,
	"player1_defense_energy" integer DEFAULT 0 NOT NULL,
	"player2_defense_energy" integer DEFAULT 0 NOT NULL,
	"player1_stored_energy" integer DEFAULT 0 NOT NULL,
	"player2_stored_energy" integer DEFAULT 0 NOT NULL,
	"player1_stored_defense_energy" integer DEFAULT 0 NOT NULL,
	"player2_stored_defense_energy" integer DEFAULT 0 NOT NULL,
	"player1_total_attacks" integer DEFAULT 0 NOT NULL,
	"player2_total_attacks" integer DEFAULT 0 NOT NULL,
	"player1_total_defends" integer DEFAULT 0 NOT NULL,
	"player2_total_defends" integer DEFAULT 0 NOT NULL,
	"round_history" jsonb DEFAULT '[]' NOT NULL,
	"battle_log" jsonb DEFAULT '[]' NOT NULL,
	"last_action_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "battle_states_battle_id_unique" UNIQUE("battle_id")
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" serial PRIMARY KEY NOT NULL,
	"player1_id" integer NOT NULL,
	"player2_id" integer NOT NULL,
	"winner_id" integer,
	"player1_cp" integer NOT NULL,
	"player2_cp" integer NOT NULL,
	"status" text DEFAULT 'preparing' NOT NULL,
	"end_reason" text,
	"fee_discount_percent" integer,
	"discount_expires_at" timestamp,
	"winner_xp" integer DEFAULT 50 NOT NULL,
	"loser_xp" integer DEFAULT 10 NOT NULL,
	"winner_cp" integer DEFAULT 10 NOT NULL,
	"loser_cp" integer DEFAULT -5 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"chain_name" varchar(50) NOT NULL,
	"contract_type" varchar(50) NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"deployed_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "platform_contracts_chain_id_contract_type_unique" UNIQUE("chain_id","contract_type")
);
--> statement-breakpoint
CREATE TABLE "user_game_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"combat_power" integer DEFAULT 100 NOT NULL,
	"login_streak" integer DEFAULT 0 NOT NULL,
	"last_login_date" timestamp,
	"total_logins" integer DEFAULT 0 NOT NULL,
	"achievements" jsonb DEFAULT '{}' NOT NULL,
	"quest_progress" jsonb DEFAULT '{}' NOT NULL,
	"stats" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"freelancer_stats" jsonb DEFAULT '{"jobsCompleted": 0, "totalEarnings": "0", "avgRating": 0, "onTimeDelivery": 0, "repeatClients": 0}' NOT NULL,
	"freelancer_achievements" jsonb DEFAULT '[]' NOT NULL,
	"freelancer_level" integer DEFAULT 1 NOT NULL,
	"freelancer_xp" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_game_data_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_trading_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"successful_trades" integer DEFAULT 0 NOT NULL,
	"total_volume" varchar(50) DEFAULT '0' NOT NULL,
	"rating" integer,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"disputes_won" integer DEFAULT 0 NOT NULL,
	"disputes_lost" integer DEFAULT 0 NOT NULL,
	"last_trade_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_trading_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "escrow_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"listing_category" varchar(20) DEFAULT 'p2p' NOT NULL,
	"listing_type" varchar(10) NOT NULL,
	"chain_id" varchar(20),
	"token_address" varchar(255),
	"token_offered" varchar(10),
	"amount" varchar(50),
	"price_per_unit" varchar(50),
	"min_amount" varchar(50),
	"max_amount" varchar(50),
	"payment_methods" jsonb DEFAULT '[]' NOT NULL,
	"payment_window" integer DEFAULT 15 NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"job_posting_id" integer,
	"service_title" varchar(200),
	"service_description" text,
	"service_category_id" integer,
	"delivery_time_days" integer,
	"revisions" integer DEFAULT 0,
	"skills_offered" jsonb DEFAULT '[]'
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"escrow_id" integer,
	"chain_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT '' NOT NULL,
	"listing_category" varchar(20) DEFAULT 'p2p' NOT NULL,
	"status" varchar(50) DEFAULT 'created' NOT NULL,
	"metadata" jsonb,
	"deposit_deadline" timestamp,
	"deposited_at" timestamp,
	"payment_sent_at" timestamp,
	"payment_confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"job_posting_id" integer,
	"bid_id" integer,
	"milestone_id" integer,
	"deliverables" jsonb DEFAULT '[]',
	"revision_count" integer DEFAULT 0,
	"freelancer_delivered_at" timestamp,
	"client_approved_at" timestamp,
	"dispute_reason" text,
	"disputed_at" timestamp
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
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freelancer_profiles_user_id_unique" UNIQUE("user_id")
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
CREATE TABLE "profile_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_drafts_user_id_unique" UNIQUE("user_id")
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
CREATE TABLE "job_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"saved_search_id" integer,
	"job_id" integer NOT NULL,
	"alert_type" varchar(50) DEFAULT 'new_match' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"shortlisted_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"milestones" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"total_amount" varchar(50),
	"platform_fee" varchar(50),
	"net_amount" varchar(50),
	"freelancer_rank" integer,
	"matching_score" integer,
	"is_auto_bid" boolean DEFAULT false NOT NULL,
	"bid_source" varchar(50) DEFAULT 'manual',
	"template_used" integer,
	"questions" jsonb DEFAULT '[]' NOT NULL,
	"answers" jsonb DEFAULT '[]' NOT NULL,
	"portfolio" jsonb DEFAULT '[]' NOT NULL,
	"certifications" jsonb DEFAULT '[]' NOT NULL,
	"rejection_reason" text,
	"client_feedback" text,
	"freelancer_response" text,
	"negotiation_history" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp
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
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"refunded_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"auto_release_enabled" boolean DEFAULT true NOT NULL,
	"auto_release_days" integer DEFAULT 7,
	"dispute_reason" text,
	"disputed_at" timestamp,
	"dispute_resolved_at" timestamp,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"revision_requests" jsonb DEFAULT '[]' NOT NULL,
	"time_tracked" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
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
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"milestones" jsonb DEFAULT '[]' NOT NULL,
	"application_deadline" timestamp,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"required_hours" integer,
	"team_size" integer DEFAULT 1,
	"location_requirement" varchar(100),
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"invite_only" boolean DEFAULT false NOT NULL,
	"auto_accept_bids" boolean DEFAULT false NOT NULL,
	"max_bids" integer,
	"current_bids_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"shortlisted_bids_count" integer DEFAULT 0 NOT NULL,
	"accepted_bid_id" integer,
	"freelancer_id" integer,
	"assigned_freelancer_id" integer,
	"assigned_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"contract_signed_at" timestamp,
	"total_budget" varchar(50),
	"paid_amount" varchar(50) DEFAULT '0',
	"escrow_id" integer,
	"requires_nda" boolean DEFAULT false NOT NULL,
	"requires_background" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"slug" varchar(255),
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"archived_at" timestamp,
	CONSTRAINT "job_postings_slug_unique" UNIQUE("slug")
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
	"rejection_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"revision_requested" boolean DEFAULT false NOT NULL,
	"revision_note" text,
	"revision_deadline" timestamp,
	"client_feedback" text,
	"freelancer_response" text,
	"quality_score" integer,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"checksum" varchar(64),
	"download_count" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"approval_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"virus_scan_result" varchar(50),
	"virus_scan_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"dependencies" jsonb DEFAULT '[]' NOT NULL,
	"subtasks" jsonb DEFAULT '[]' NOT NULL,
	"comments" jsonb DEFAULT '[]' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_pattern" jsonb,
	"parent_task_id" integer,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"time_tracked" integer DEFAULT 0 NOT NULL,
	"billable_time" integer DEFAULT 0 NOT NULL,
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
	"rejected_at" timestamp,
	"rejection_reason" text,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"screenshots" jsonb DEFAULT '[]' NOT NULL,
	"activity_level" integer,
	"keystrokes" integer,
	"mouse_clicks" integer,
	"apps_used" jsonb DEFAULT '[]' NOT NULL,
	"websites_visited" jsonb DEFAULT '[]' NOT NULL,
	"break_time" integer DEFAULT 0 NOT NULL,
	"is_manual_entry" boolean DEFAULT false NOT NULL,
	"timezone" varchar(50),
	"client_note" text,
	"freelancer_note" text,
	"invoice_id" integer,
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
	"attendees" jsonb DEFAULT '[]' NOT NULL,
	"created_by" integer NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"reminder_minutes" integer,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"recurring_pattern" jsonb,
	"time_zone" varchar(50),
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"notes" text,
	"agenda" text,
	"outcomes" text,
	"action_items" jsonb DEFAULT '[]' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp,
	"attendance_tracking" jsonb DEFAULT '{}' NOT NULL,
	"recording_url" text,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp,
	"completed_at" timestamp
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
	CONSTRAINT "workspace_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
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
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"admin_note" text,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"hidden_at" timestamp,
	"hidden_by" integer,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"project_budget" varchar(50),
	"project_duration" integer,
	"payment_timing" varchar(50),
	"scope_clarity" integer,
	"feedback_quality" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"response" text,
	"response_at" timestamp,
	"admin_note" text,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" text,
	"hidden_at" timestamp,
	"hidden_by" integer,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"project_budget" varchar(50),
	"project_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"minted_by" integer,
	"minting_cost" varchar(50),
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"rarity" varchar(20),
	"transferable" boolean DEFAULT false NOT NULL,
	"burned" boolean DEFAULT false NOT NULL,
	"burned_at" timestamp,
	"burn_tx_hash" varchar(66),
	"current_owner" varchar(42),
	"transfer_history" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
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
	"jobs_completed" integer DEFAULT 0 NOT NULL,
	"total_earnings" varchar(50) DEFAULT '0' NOT NULL,
	"on_time_delivery_rate" integer DEFAULT 0 NOT NULL,
	"repeat_client_rate" integer DEFAULT 0 NOT NULL,
	"skill_verification_count" integer DEFAULT 0 NOT NULL,
	"certification_count" integer DEFAULT 0 NOT NULL,
	"endorsement_count" integer DEFAULT 0 NOT NULL,
	"dispute_count" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"suspension_count" integer DEFAULT 0 NOT NULL,
	"trust_score" integer DEFAULT 50 NOT NULL,
	"professionalism_score" integer DEFAULT 50 NOT NULL,
	"communication_score" integer DEFAULT 50 NOT NULL,
	"quality_score" integer DEFAULT 50 NOT NULL,
	"reliability_score" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"endorsement_note" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"verified_by" integer,
	"verification_document" text,
	"verification_score" integer,
	"notes" text,
	"revoked_at" timestamp,
	"revoked_by" integer,
	"revocation_reason" text,
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
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"is_featured" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'draft',
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"last_modified_by" integer,
	"version" integer DEFAULT 1,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
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
	"metadata" jsonb,
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
	"contract_signed_at" timestamp,
	"last_activity_at" timestamp,
	"performance_metrics" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partners_email_unique" UNIQUE("email"),
	CONSTRAINT "partners_api_key_unique" UNIQUE("api_key")
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
	"conversion_value" numeric(10, 2),
	"commission_rate" numeric(5, 2),
	"commission_amount" numeric(10, 2),
	"ip_address" varchar(50),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
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
CREATE TABLE "job_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"failed_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_task_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"run_time" integer,
	"output" text,
	"error" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"task_type" varchar(50) NOT NULL,
	"schedule" varchar(100),
	"endpoint" varchar(200),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"average_run_time" integer,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_tasks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_owner_id_users_id_fk" FOREIGN KEY ("team_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_requests" ADD CONSTRAINT "email_verification_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_last_read_message_id_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievement_nfts" ADD CONSTRAINT "achievement_nfts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_invitations" ADD CONSTRAINT "battle_invitations_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_invitations" ADD CONSTRAINT "battle_invitations_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_invitations" ADD CONSTRAINT "battle_invitations_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_queue" ADD CONSTRAINT "battle_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_queue" ADD CONSTRAINT "battle_queue_matched_with_user_id_users_id_fk" FOREIGN KEY ("matched_with_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_session_rejections" ADD CONSTRAINT "battle_session_rejections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_session_rejections" ADD CONSTRAINT "battle_session_rejections_rejected_user_id_users_id_fk" FOREIGN KEY ("rejected_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_states" ADD CONSTRAINT "battle_states_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_data" ADD CONSTRAINT "user_game_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_trading_stats" ADD CONSTRAINT "user_trading_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_listings" ADD CONSTRAINT "escrow_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_freelancer_id_freelancer_profiles_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_drafts" ADD CONSTRAINT "profile_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_templates" ADD CONSTRAINT "bid_templates_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_bids" ADD CONSTRAINT "job_bids_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_milestones" ADD CONSTRAINT "job_milestones_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_assigned_freelancer_id_users_id_fk" FOREIGN KEY ("assigned_freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_delivered_by_users_id_fk" FOREIGN KEY ("delivered_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_packages" ADD CONSTRAINT "delivery_packages_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_file_version_id_file_versions_id_fk" FOREIGN KEY ("file_version_id") REFERENCES "public"."file_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_annotations" ADD CONSTRAINT "file_annotations_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_versions" ADD CONSTRAINT "file_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_chats" ADD CONSTRAINT "milestone_chats_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone_revisions" ADD CONSTRAINT "milestone_revisions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_task_id_job_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."job_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_tracking" ADD CONSTRAINT "time_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_events" ADD CONSTRAINT "workspace_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_sessions" ADD CONSTRAINT "workspace_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_nfts" ADD CONSTRAINT "reputation_nfts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_nfts" ADD CONSTRAINT "reputation_nfts_minted_by_users_id_fk" FOREIGN KEY ("minted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_registry" ADD CONSTRAINT "reputation_registry_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_disputes" ADD CONSTRAINT "review_disputes_disputed_by_users_id_fk" FOREIGN KEY ("disputed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_disputes" ADD CONSTRAINT "review_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorser_id_users_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorsed_user_id_users_id_fk" FOREIGN KEY ("endorsed_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_badges" ADD CONSTRAINT "verification_badges_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referral_link_id_referral_links_id_fk" FOREIGN KEY ("referral_link_id") REFERENCES "public"."referral_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_campaign_id_referral_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."referral_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_campaign_id_referral_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."referral_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_votes" ADD CONSTRAINT "faq_votes_faq_id_faq_items_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_votes" ADD CONSTRAINT "faq_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_step_id_onboarding_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."onboarding_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_progress" ADD CONSTRAINT "tutorial_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_progress" ADD CONSTRAINT "tutorial_progress_tutorial_id_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_video_tutorials_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video_tutorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_task_runs" ADD CONSTRAINT "scheduled_task_runs_task_id_scheduled_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."scheduled_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_earnings_freelancer" ON "earnings" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_job" ON "earnings" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_milestone" ON "earnings" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_earnings_status" ON "earnings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_earnings_available_at" ON "earnings" USING btree ("available_at");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_invoice" ON "payment_reminders" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_recipient" ON "payment_reminders" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_scheduled" ON "payment_reminders" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_payment_reminders_status" ON "payment_reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_user" ON "tax_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_year" ON "tax_documents" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_tax_documents_type" ON "tax_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_freelancer" ON "withdrawals" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_status" ON "withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_created" ON "withdrawals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_attachments_message" ON "attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_messages_context" ON "messages" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_job_posting" ON "messages" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_messages_bid" ON "messages" USING btree ("bid_id");--> statement-breakpoint
CREATE INDEX "idx_achievement_nfts_user" ON "achievement_nfts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_from_user" ON "battle_invitations" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_to_user" ON "battle_invitations" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_status" ON "battle_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_expires" ON "battle_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_user" ON "battle_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_status" ON "battle_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_cp_range" ON "battle_queue" USING btree ("min_cp","max_cp");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_expires" ON "battle_queue" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_battle_rounds_battle" ON "battle_rounds" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "idx_battle_rounds_number" ON "battle_rounds" USING btree ("battle_id","round_number");--> statement-breakpoint
CREATE INDEX "idx_battle_session_rejections_user" ON "battle_session_rejections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_session_rejections_session" ON "battle_session_rejections" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_battle_session_rejections_expires" ON "battle_session_rejections" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_battle_states_battle" ON "battle_states" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "idx_battle_states_updated" ON "battle_states" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_battles_player1" ON "battles" USING btree ("player1_id");--> statement-breakpoint
CREATE INDEX "idx_battles_player2" ON "battles" USING btree ("player2_id");--> statement-breakpoint
CREATE INDEX "idx_battles_winner" ON "battles" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "idx_battles_status" ON "battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_game_data_user" ON "user_game_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_trading_stats_user" ON "user_trading_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_trading_stats_rating" ON "user_trading_stats" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_user" ON "escrow_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_active" ON "escrow_listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_type" ON "escrow_listings" USING btree ("listing_type");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_category" ON "escrow_listings" USING btree ("listing_category");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_job_posting" ON "escrow_listings" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_escrow_listings_service_category" ON "escrow_listings" USING btree ("service_category_id");--> statement-breakpoint
CREATE INDEX "idx_trades_escrow" ON "trades" USING btree ("chain_id","escrow_id");--> statement-breakpoint
CREATE INDEX "idx_trades_status" ON "trades" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trades_buyer" ON "trades" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_trades_seller" ON "trades" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_trades_deposit_deadline" ON "trades" USING btree ("deposit_deadline");--> statement-breakpoint
CREATE INDEX "idx_trades_category" ON "trades" USING btree ("listing_category");--> statement-breakpoint
CREATE INDEX "idx_trades_job_posting" ON "trades" USING btree ("job_posting_id");--> statement-breakpoint
CREATE INDEX "idx_trades_bid" ON "trades" USING btree ("bid_id");--> statement-breakpoint
CREATE INDEX "idx_trades_milestone" ON "trades" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_user" ON "freelancer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_availability" ON "freelancer_profiles" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_rating" ON "freelancer_profiles" USING btree ("avg_rating");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_verification" ON "freelancer_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_created" ON "freelancer_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_freelancer" ON "freelancer_skills" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_skill" ON "freelancer_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_verified" ON "freelancer_skills" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_level" ON "freelancer_skills" USING btree ("skill_level");--> statement-breakpoint
CREATE INDEX "idx_invoices_freelancer" ON "invoices" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_client" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_job" ON "invoices" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_milestone" ON "invoices" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_job_categories_slug" ON "job_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_job_categories_parent" ON "job_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE INDEX "idx_portfolio_items_freelancer" ON "portfolio_items" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_portfolio_items_category" ON "portfolio_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_profile_drafts_user" ON "profile_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_jobs_freelancer" ON "saved_jobs" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_skills_category" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_bid_templates_freelancer" ON "bid_templates" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_bid_templates_default" ON "bid_templates" USING btree ("freelancer_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_user" ON "job_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_job" ON "job_alerts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_status" ON "job_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_alerts_type" ON "job_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "idx_job_bids_job" ON "job_bids" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_freelancer" ON "job_bids" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_job_bids_status" ON "job_bids" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_bids_amount" ON "job_bids" USING btree ("bid_amount");--> statement-breakpoint
CREATE INDEX "idx_job_bids_created" ON "job_bids" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_job_freelancer_bid" ON "job_bids" USING btree ("job_id","freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_job_invitations_job" ON "job_invitations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_invitations_freelancer" ON "job_invitations" USING btree ("freelancer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_job_freelancer_invitation" ON "job_invitations" USING btree ("job_id","freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_job" ON "job_milestones" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_status" ON "job_milestones" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_due_date" ON "job_milestones" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_job_milestones_sort" ON "job_milestones" USING btree ("job_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_job_postings_client" ON "job_postings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_job_postings_category" ON "job_postings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_job_postings_status" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_postings_deadline" ON "job_postings" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "idx_job_postings_created" ON "job_postings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_postings_budget" ON "job_postings" USING btree ("budget_type");--> statement-breakpoint
CREATE INDEX "idx_job_postings_location" ON "job_postings" USING btree ("location_requirement");--> statement-breakpoint
CREATE INDEX "idx_job_postings_visibility" ON "job_postings" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_job_postings_assigned" ON "job_postings" USING btree ("assigned_freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_user" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_type" ON "saved_searches" USING btree ("search_type");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_alerts" ON "saved_searches" USING btree ("alerts_enabled");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_job" ON "delivery_packages" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_milestone" ON "delivery_packages" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_delivered_by" ON "delivery_packages" USING btree ("delivered_by");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_status" ON "delivery_packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_delivery_packages_delivered_at" ON "delivery_packages" USING btree ("delivered_at");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_file_version" ON "file_annotations" USING btree ("file_version_id");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_user" ON "file_annotations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_status" ON "file_annotations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_file_annotations_parent" ON "file_annotations" USING btree ("parent_annotation_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_job" ON "file_versions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_attachment" ON "file_versions" USING btree ("attachment_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_uploaded_by" ON "file_versions" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_file_versions_latest" ON "file_versions" USING btree ("is_latest");--> statement-breakpoint
CREATE INDEX "idx_file_versions_original" ON "file_versions" USING btree ("original_file_id");--> statement-breakpoint
CREATE INDEX "idx_file_versions_approval" ON "file_versions" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_job" ON "job_tasks" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_milestone" ON "job_tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_assigned" ON "job_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_created_by" ON "job_tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_status" ON "job_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_priority" ON "job_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_due_date" ON "job_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_job_tasks_parent" ON "job_tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_milestone" ON "milestone_chats" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_sender" ON "milestone_chats" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_chats_type" ON "milestone_chats" USING btree ("message_type");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_milestone" ON "milestone_revisions" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_requested_by" ON "milestone_revisions" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "idx_milestone_revisions_status" ON "milestone_revisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_job" ON "time_tracking" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_user" ON "time_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_milestone" ON "time_tracking" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_task" ON "time_tracking" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_status" ON "time_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_start" ON "time_tracking" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_time_tracking_billable" ON "time_tracking" USING btree ("is_billable");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_job" ON "workspace_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_created_by" ON "workspace_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_type" ON "workspace_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_start" ON "workspace_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_workspace_events_status" ON "workspace_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_job" ON "workspace_sessions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_user" ON "workspace_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_status" ON "workspace_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workspace_sessions_activity" ON "workspace_sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_job" ON "client_reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_reviewer" ON "client_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_client" ON "client_reviews" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_rating" ON "client_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_public" ON "client_reviews" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_client_reviews_created" ON "client_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_client_review_per_job" ON "client_reviews" USING btree ("job_id","reviewer_id","client_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_job" ON "freelancer_reviews" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_reviewer" ON "freelancer_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_freelancer" ON "freelancer_reviews" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_rating" ON "freelancer_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_public" ON "freelancer_reviews" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_created" ON "freelancer_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_freelancer_review_per_job" ON "freelancer_reviews" USING btree ("job_id","reviewer_id","freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_user" ON "reputation_nfts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_type" ON "reputation_nfts" USING btree ("nft_type");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_token" ON "reputation_nfts" USING btree ("token_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_level" ON "reputation_nfts" USING btree ("reputation_level");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_owner" ON "reputation_nfts" USING btree ("current_owner");--> statement-breakpoint
CREATE INDEX "idx_reputation_nfts_burned" ON "reputation_nfts" USING btree ("burned");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_user" ON "reputation_registry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_wallet" ON "reputation_registry" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_score" ON "reputation_registry" USING btree ("reputation_score");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_freelancer" ON "reputation_registry" USING btree ("is_freelancer");--> statement-breakpoint
CREATE INDEX "idx_reputation_registry_trust" ON "reputation_registry" USING btree ("trust_score");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_reputation_registry_user" ON "reputation_registry" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_reputation_registry_wallet" ON "reputation_registry" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_review" ON "review_disputes" USING btree ("review_id","review_type");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_disputed_by" ON "review_disputes" USING btree ("disputed_by");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_status" ON "review_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_disputes_resolved_by" ON "review_disputes" USING btree ("resolved_by");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_review_dispute" ON "review_disputes" USING btree ("review_id","review_type","disputed_by");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_endorser" ON "skill_endorsements" USING btree ("endorser_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_endorsed" ON "skill_endorsements" USING btree ("endorsed_user_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_skill" ON "skill_endorsements" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_verified" ON "skill_endorsements" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "idx_skill_endorsements_public" ON "skill_endorsements" USING btree ("is_public");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_skill_endorsement" ON "skill_endorsements" USING btree ("endorser_id","endorsed_user_id","skill_id");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_user" ON "verification_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_type" ON "verification_badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_active" ON "verification_badges" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_verification_badges_level" ON "verification_badges" USING btree ("verification_level");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_badge_type" ON "verification_badges" USING btree ("user_id","badge_type");--> statement-breakpoint
CREATE UNIQUE INDEX "faq_votes_user_faq_idx" ON "faq_votes" USING btree ("user_id","faq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faq_votes_session_faq_idx" ON "faq_votes" USING btree ("session_id","faq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_progress_user_step_idx" ON "onboarding_progress" USING btree ("user_id","step_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tutorial_progress_user_tutorial_idx" ON "tutorial_progress" USING btree ("user_id","tutorial_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_progress_user_video_idx" ON "video_progress" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "idx_job_queue_type" ON "job_queue" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_job_queue_status" ON "job_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_queue_scheduled" ON "job_queue" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_job_queue_available" ON "job_queue" USING btree ("available_at");--> statement-breakpoint
CREATE INDEX "idx_task_runs_task" ON "scheduled_task_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_runs_status" ON "scheduled_task_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_runs_started" ON "scheduled_task_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_active" ON "scheduled_tasks" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_next_run" ON "scheduled_tasks" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_type" ON "scheduled_tasks" USING btree ("task_type");