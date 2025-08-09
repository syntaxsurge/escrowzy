ALTER TABLE "battles" ADD COLUMN "winner_xp" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "battles" ADD COLUMN "loser_xp" integer DEFAULT 10 NOT NULL;