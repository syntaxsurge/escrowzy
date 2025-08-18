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
ALTER TABLE "blog_comments" DROP CONSTRAINT "blog_comments_parent_id_blog_comments_id_fk";
--> statement-breakpoint
ALTER TABLE "faq_categories" DROP CONSTRAINT "faq_categories_parent_id_faq_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD COLUMN "metadata" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD COLUMN "profile_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "scheduled_task_runs" ADD CONSTRAINT "scheduled_task_runs_task_id_scheduled_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."scheduled_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_task_runs_task" ON "scheduled_task_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_runs_status" ON "scheduled_task_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_runs_started" ON "scheduled_task_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_active" ON "scheduled_tasks" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_type" ON "scheduled_tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "idx_scheduled_tasks_next_run" ON "scheduled_tasks" USING btree ("next_run_at");