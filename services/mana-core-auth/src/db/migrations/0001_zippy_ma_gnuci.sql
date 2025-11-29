CREATE SCHEMA "feedback";
--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'feature', 'improvement', 'question', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined');--> statement-breakpoint
CREATE TABLE "feedback"."feedback_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback"."user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"app_id" text NOT NULL,
	"title" text,
	"feedback_text" text NOT NULL,
	"category" "feedback_category" DEFAULT 'feature' NOT NULL,
	"status" "feedback_status" DEFAULT 'submitted' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"admin_response" text,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"device_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "feedback"."feedback_votes" ADD CONSTRAINT "feedback_votes_feedback_id_user_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "feedback"."user_feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback"."feedback_votes" ADD CONSTRAINT "feedback_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback"."user_feedback" ADD CONSTRAINT "user_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_vote_unique" ON "feedback"."feedback_votes" USING btree ("feedback_id","user_id");--> statement-breakpoint
CREATE INDEX "feedback_votes_feedback_idx" ON "feedback"."feedback_votes" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "feedback_user_idx" ON "feedback"."user_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_app_idx" ON "feedback"."user_feedback" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "feedback_public_idx" ON "feedback"."user_feedback" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback"."user_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback"."user_feedback" USING btree ("created_at");