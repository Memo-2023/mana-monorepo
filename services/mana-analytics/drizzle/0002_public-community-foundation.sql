-- 0002_public-community-foundation.sql
--
-- Phase 2.1 von docs/plans/feedback-hub-public.md.
--
-- Macht user_feedback bereit für die Public-Community-Surface:
-- Pseudonym (display_hash + display_name), Modul-Kontext, 1-Level-Reply-
-- Threading, Slack-Style-Reactions (statt simpler Vote-Counter), Cached-
-- Score für Sort.
--
-- feedback_votes wird durch feedback_reactions ersetzt (0 Rows in Prod
-- + lokal vor diesem Commit verifiziert, deshalb destruktiver DROP/CREATE
-- statt Rename+Add-Column).
--
-- Apply manuell:
--   psql "$DATABASE_URL" -f services/mana-analytics/drizzle/0002_public-community-foundation.sql
--
-- Idempotent via IF EXISTS / IF NOT EXISTS.

BEGIN;

-- 1. Pseudonym + Module-Context + Threading + Reactions auf user_feedback
ALTER TABLE feedback.user_feedback
	ADD COLUMN IF NOT EXISTS display_hash text,
	ADD COLUMN IF NOT EXISTS display_name text,
	ADD COLUMN IF NOT EXISTS module_context text,
	ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES feedback.user_feedback(id) ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
	ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS feedback_display_hash_idx ON feedback.user_feedback(display_hash);
CREATE INDEX IF NOT EXISTS feedback_module_context_idx ON feedback.user_feedback(module_context);
CREATE INDEX IF NOT EXISTS feedback_parent_id_idx ON feedback.user_feedback(parent_id);
CREATE INDEX IF NOT EXISTS feedback_score_idx ON feedback.user_feedback(score DESC);

-- 2. feedback_votes durch feedback_reactions ersetzen
DROP TABLE IF EXISTS feedback.feedback_votes;

CREATE TABLE IF NOT EXISTS feedback.feedback_reactions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	feedback_id uuid NOT NULL REFERENCES feedback.user_feedback(id) ON DELETE CASCADE,
	user_id text NOT NULL,
	emoji text NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS feedback_reactions_unique
	ON feedback.feedback_reactions(feedback_id, user_id, emoji);
CREATE INDEX IF NOT EXISTS feedback_reactions_feedback_idx
	ON feedback.feedback_reactions(feedback_id);

COMMIT;
