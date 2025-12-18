-- Fix missing session columns using native PostgreSQL syntax
-- This is more reliable than DO blocks for Drizzle migrations

ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "refresh_token" text;
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "device_id" text;
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "device_name" text;
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp with time zone DEFAULT now();
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD COLUMN IF NOT EXISTS "remember_me" boolean DEFAULT false;
