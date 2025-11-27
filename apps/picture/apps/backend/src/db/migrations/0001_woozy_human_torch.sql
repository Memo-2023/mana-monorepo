CREATE TYPE "public"."batch_status" AS ENUM('pending', 'processing', 'completed', 'partial', 'failed');--> statement-breakpoint
CREATE TABLE "batch_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text,
	"total_count" integer NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"processing_count" integer DEFAULT 0 NOT NULL,
	"pending_count" integer DEFAULT 0 NOT NULL,
	"status" "batch_status" DEFAULT 'pending' NOT NULL,
	"model_id" uuid,
	"model_version" text,
	"width" integer,
	"height" integer,
	"steps" integer,
	"guidance_scale" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
