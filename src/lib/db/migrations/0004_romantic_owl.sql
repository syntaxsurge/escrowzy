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
	CONSTRAINT "battle_queue_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "battle_queue" ADD CONSTRAINT "battle_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_queue" ADD CONSTRAINT "battle_queue_matched_with_user_id_users_id_fk" FOREIGN KEY ("matched_with_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_battle_queue_user" ON "battle_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_status" ON "battle_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_cp_range" ON "battle_queue" USING btree ("min_cp","max_cp");--> statement-breakpoint
CREATE INDEX "idx_battle_queue_expires" ON "battle_queue" USING btree ("expires_at");