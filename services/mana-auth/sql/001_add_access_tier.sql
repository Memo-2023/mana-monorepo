-- Migration: Add access_tier to users table
-- Run this on production before deploying the new mana-auth version.
-- After this migration, run `drizzle-kit push` or redeploy mana-auth.
--
-- Alternatively, just run `pnpm db:push` from services/mana-auth/ which
-- will apply the schema change automatically via Drizzle Kit.

-- Step 1: Create the enum type (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_tier') THEN
        CREATE TYPE public.access_tier AS ENUM ('guest', 'public', 'beta', 'alpha', 'founder');
    END IF;
END
$$;

-- Step 2: Add the column with default 'public'
ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS access_tier public.access_tier NOT NULL DEFAULT 'public';

-- Step 3: Set yourself (founder) — replace with your actual email
-- UPDATE auth.users SET access_tier = 'founder' WHERE email = 'your@email.com';
