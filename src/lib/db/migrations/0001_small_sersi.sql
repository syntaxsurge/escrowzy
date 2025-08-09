ALTER TABLE "trades" ADD COLUMN "listing_category" varchar(20) DEFAULT 'p2p' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_trades_category" ON "trades" USING btree ("listing_category");