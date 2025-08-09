CREATE TABLE "battle_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"player1_health" integer DEFAULT 100 NOT NULL,
	"player2_health" integer DEFAULT 100 NOT NULL,
	"player1_actions" jsonb DEFAULT '[]' NOT NULL,
	"player2_actions" jsonb DEFAULT '[]' NOT NULL,
	"battle_log" jsonb DEFAULT '[]' NOT NULL,
	"last_action_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "battle_states_battle_id_unique" UNIQUE("battle_id")
);
--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "status" text DEFAULT 'preparing' NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "battle_states" ADD CONSTRAINT "battle_states_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_battle_states_battle" ON "battle_states" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "idx_battle_states_updated" ON "battle_states" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_battles_status" ON "battles" USING btree ("status");