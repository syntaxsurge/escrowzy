ALTER TABLE "client_reviews" DROP CONSTRAINT "client_reviews_job_id_job_postings_id_fk";
--> statement-breakpoint
ALTER TABLE "client_reviews" DROP CONSTRAINT "client_reviews_reviewer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "client_reviews" DROP CONSTRAINT "client_reviews_client_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_profiles" DROP CONSTRAINT "freelancer_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_reviews" DROP CONSTRAINT "freelancer_reviews_job_id_job_postings_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_reviews" DROP CONSTRAINT "freelancer_reviews_reviewer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_reviews" DROP CONSTRAINT "freelancer_reviews_freelancer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "freelancer_skills" DROP CONSTRAINT "freelancer_skills_skill_id_skills_id_fk";
--> statement-breakpoint
ALTER TABLE "job_categories" DROP CONSTRAINT "job_categories_parent_category_id_job_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "job_postings" DROP CONSTRAINT "job_postings_client_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "job_postings" DROP CONSTRAINT "job_postings_category_id_job_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "job_postings" DROP CONSTRAINT "job_postings_freelancer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_profiles" ADD CONSTRAINT "freelancer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_reviews" ADD CONSTRAINT "freelancer_reviews_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_reviews_rating" ON "client_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_verification" ON "freelancer_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_freelancer_profiles_created" ON "freelancer_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_freelancer_reviews_rating" ON "freelancer_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_verified" ON "freelancer_skills" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_freelancer_skills_level" ON "freelancer_skills" USING btree ("skill_level");--> statement-breakpoint
CREATE INDEX "idx_job_postings_created" ON "job_postings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_job_postings_deadline" ON "job_postings" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "idx_job_postings_budget" ON "job_postings" USING btree ("budget_min","budget_max");