CREATE TABLE "battle_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"round_number" integer NOT NULL,
	"attacker" integer NOT NULL,
	"damage" integer NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"player1_health" integer NOT NULL,
	"player2_health" integer NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_battle_round" UNIQUE("battle_id","round_number")
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
ALTER TABLE "battle_rounds" ADD CONSTRAINT "battle_rounds_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_battle_rounds_battle" ON "battle_rounds" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "idx_battle_rounds_number" ON "battle_rounds" USING btree ("battle_id","round_number");--> statement-breakpoint
CREATE INDEX "idx_job_queue_status" ON "job_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_queue_type" ON "job_queue" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_job_queue_available" ON "job_queue" USING btree ("available_at","status");--> statement-breakpoint
CREATE INDEX "idx_job_queue_scheduled" ON "job_queue" USING btree ("scheduled_at");