CREATE TABLE "battle_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"from_user_cp" integer NOT NULL,
	"to_user_cp" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "unique_active_invitation" UNIQUE("from_user_id","to_user_id","status")
);
--> statement-breakpoint
CREATE TABLE "battle_session_rejections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rejected_user_id" integer NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "unique_session_rejection" UNIQUE("user_id","rejected_user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "battle_queue" ADD COLUMN "queue_position" integer;--> statement-breakpoint
ALTER TABLE "battle_queue" ADD COLUMN "estimated_wait_time" integer;--> statement-breakpoint
ALTER TABLE "battle_invitations" ADD CONSTRAINT "battle_invitations_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_invitations" ADD CONSTRAINT "battle_invitations_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_session_rejections" ADD CONSTRAINT "battle_session_rejections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_session_rejections" ADD CONSTRAINT "battle_session_rejections_rejected_user_id_users_id_fk" FOREIGN KEY ("rejected_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_from" ON "battle_invitations" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_to" ON "battle_invitations" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_status" ON "battle_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_battle_invitations_expires" ON "battle_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_battle_rejections_user" ON "battle_session_rejections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_rejections_rejected" ON "battle_session_rejections" USING btree ("rejected_user_id");--> statement-breakpoint
CREATE INDEX "idx_battle_rejections_session" ON "battle_session_rejections" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_battle_rejections_expires" ON "battle_session_rejections" USING btree ("expires_at");