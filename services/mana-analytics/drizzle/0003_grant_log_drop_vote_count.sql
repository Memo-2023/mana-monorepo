-- 0003_grant_log_drop_vote_count.sql
--
-- Phase 3.A.2 von docs/plans/feedback-rewards-and-identity.md.
--
-- 1. Mini-Tabelle feedback_grant_log als sliding-window Rate-Limit-
--    Counter für die Community-Credit-Grants (max 10/User/24h).
-- 2. Drop legacy vote_count column from user_feedback (Phase 3.F):
--    Reactions+score haben sie seit 0002 vollständig ersetzt.
--
-- Apply manually before next push:
--   psql "$DATABASE_URL" -f services/mana-analytics/drizzle/0003_grant_log_drop_vote_count.sql

BEGIN;

CREATE TABLE IF NOT EXISTS feedback.feedback_grant_log (
	user_id text NOT NULL,
	granted_at timestamptz NOT NULL DEFAULT now(),
	reason text NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_grant_log_recent_idx
	ON feedback.feedback_grant_log (user_id, granted_at);

ALTER TABLE feedback.user_feedback DROP COLUMN IF EXISTS vote_count;

COMMIT;
