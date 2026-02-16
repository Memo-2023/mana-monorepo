-- Migration: Simplify Credits System
-- Date: 2026-02-16
-- Description: Remove free credits and B2B organization credits
--
-- This migration:
-- 1. Migrates existing free credits to balance (one-time)
-- 2. Drops B2B organization credit tables
-- 3. Removes free credit columns from balances table
--
-- IMPORTANT: Run this migration during low-traffic period as it modifies the balances table

-- Step 1: Migrate free credits to balance (one-time conversion)
-- Any existing free_credits_remaining are added to the main balance
UPDATE credits.balances
SET balance = balance + free_credits_remaining
WHERE free_credits_remaining > 0;

-- Step 2: Drop B2B organization credit tables (if they exist)
DROP TABLE IF EXISTS credits.credit_allocations CASCADE;
DROP TABLE IF EXISTS credits.organization_balances CASCADE;

-- Step 3: Remove organization_id from transactions (if column exists)
ALTER TABLE credits.transactions
DROP COLUMN IF EXISTS organization_id;

-- Step 4: Remove free credit columns from balances table
ALTER TABLE credits.balances
DROP COLUMN IF EXISTS free_credits_remaining,
DROP COLUMN IF EXISTS daily_free_credits,
DROP COLUMN IF EXISTS last_daily_reset_at;

-- Step 5: Drop old transaction type values (Note: PostgreSQL doesn't support direct enum value removal)
-- The old values (bonus, expiry, adjustment, gift_reserve, gift_release, gift_receive)
-- remain in the enum for backward compatibility with historical data.
-- New transactions will only use: purchase, usage, refund, gift

-- Verification queries (run manually to confirm migration):
-- SELECT COUNT(*) FROM credits.balances WHERE free_credits_remaining IS NOT NULL;  -- Should be 0 after migration
-- SELECT column_name FROM information_schema.columns WHERE table_schema = 'credits' AND table_name = 'balances';
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'credits' AND table_name = 'organization_balances';  -- Should be 0
