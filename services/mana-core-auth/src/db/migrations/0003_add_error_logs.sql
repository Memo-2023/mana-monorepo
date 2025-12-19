-- Add error_logs schema and table for centralized error tracking
-- This migration is safe to run on existing databases

-- Create error_logs schema if not exists
CREATE SCHEMA IF NOT EXISTS "error_logs";

-- Create enum types if not exist (PostgreSQL 9.1+ required for IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE "error_source_type" AS ENUM('backend', 'frontend_web', 'frontend_mobile');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "error_environment" AS ENUM('development', 'staging', 'production');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "error_severity" AS ENUM('debug', 'info', 'warning', 'error', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create error_logs table
CREATE TABLE IF NOT EXISTS "error_logs"."error_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "error_code" text NOT NULL,
    "error_type" text NOT NULL,
    "message" text NOT NULL,
    "stack_trace" text,
    "app_id" text NOT NULL,
    "source_type" "error_source_type",
    "service_name" text,
    "user_id" text,
    "session_id" text,
    "request_url" text,
    "request_method" text,
    "request_headers" jsonb,
    "request_body" jsonb,
    "response_status_code" integer,
    "environment" "error_environment",
    "severity" "error_severity" DEFAULT 'error',
    "context" jsonb DEFAULT '{}'::jsonb,
    "fingerprint" text,
    "user_agent" text,
    "browser_info" jsonb,
    "device_info" jsonb,
    "occurred_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint (safe - ignores if exists)
DO $$ BEGIN
    ALTER TABLE "error_logs"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes (safe - ignores if exists)
CREATE INDEX IF NOT EXISTS "error_logs_app_id_idx" ON "error_logs"."error_logs" USING btree ("app_id");
CREATE INDEX IF NOT EXISTS "error_logs_user_id_idx" ON "error_logs"."error_logs" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "error_logs_environment_idx" ON "error_logs"."error_logs" USING btree ("environment");
CREATE INDEX IF NOT EXISTS "error_logs_severity_idx" ON "error_logs"."error_logs" USING btree ("severity");
CREATE INDEX IF NOT EXISTS "error_logs_occurred_at_idx" ON "error_logs"."error_logs" USING btree ("occurred_at");
CREATE INDEX IF NOT EXISTS "error_logs_error_code_idx" ON "error_logs"."error_logs" USING btree ("error_code");
CREATE INDEX IF NOT EXISTS "error_logs_fingerprint_idx" ON "error_logs"."error_logs" USING btree ("fingerprint");
