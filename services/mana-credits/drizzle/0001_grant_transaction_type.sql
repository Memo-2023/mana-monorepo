-- 0001_grant_transaction_type.sql
--
-- Phase 3.A.1 von docs/plans/feedback-rewards-and-identity.md.
--
-- Erweitert credits.transaction_type um 'grant' für Reward-Auszahlungen
-- (mana-analytics ruft /internal/credits/grant für +5 / +500 / +25
-- Belohnungen auf). Plus ein partial-Index auf metadata.referenceId,
-- damit Idempotency-Lookup beim Re-Grant in O(log n) läuft.
--
-- Apply manually before next `pnpm db:push`:
--   psql "$DATABASE_URL" -f services/mana-credits/drizzle/0001_grant_transaction_type.sql
--
-- Idempotent via IF NOT EXISTS / ADD VALUE IF NOT EXISTS.

BEGIN;

ALTER TYPE public.transaction_type ADD VALUE IF NOT EXISTS 'grant';

CREATE INDEX IF NOT EXISTS transactions_reference_id_idx
	ON credits.transactions ((metadata ->> 'referenceId'))
	WHERE metadata ->> 'referenceId' IS NOT NULL;

COMMIT;
