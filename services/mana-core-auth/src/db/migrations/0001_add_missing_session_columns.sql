-- Migration: Add missing columns to sessions table
-- This handles the case where the table was created by db:push before these columns were added

-- Add missing columns to sessions table (IF NOT EXISTS equivalent using DO block)
DO $$
BEGIN
    -- refresh_token column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'refresh_token') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "refresh_token" text;
    END IF;

    -- refresh_token_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'refresh_token_expires_at') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;
    END IF;

    -- device_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'device_id') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "device_id" text;
    END IF;

    -- device_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'device_name') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "device_name" text;
    END IF;

    -- last_activity_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'last_activity_at') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "last_activity_at" timestamp with time zone DEFAULT now();
    END IF;

    -- revoked_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'revoked_at') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "revoked_at" timestamp with time zone;
    END IF;

    -- remember_me column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'remember_me') THEN
        ALTER TABLE "auth"."sessions" ADD COLUMN "remember_me" boolean DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

-- Add unique constraint on refresh_token if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_refresh_token_unique') THEN
        ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token");
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
