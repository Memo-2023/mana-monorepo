-- 0001_align-feedback-enums.sql
--
-- Bringt die Postgres-Enums `feedback.feedback_category` und
-- `feedback.feedback_status` mit dem `@mana/feedback`-Package in Einklang
-- und legt die `onboarding-wish`-Kategorie für den letzten
-- Onboarding-Schritt an.
--
-- Hand-authored, weil `drizzle-kit push` Enum-Werte nicht zuverlässig
-- umbenennt. Apply manually before next `pnpm db:push`:
--
--   psql "$DATABASE_URL" -f services/mana-analytics/drizzle/0001_align-feedback-enums.sql
--
-- Idempotent: alle Schritte verwenden `IF EXISTS` / `IF NOT EXISTS`-Checks
-- via DO-Blöcke, sodass Re-Runs nicht failen.

BEGIN;

-- 1. Status-Werte umbenennen, sodass sie zum Package passen.
--    PostgreSQL ≥10 supportet ALTER TYPE … RENAME VALUE non-destructive.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'feedback' AND e.enumlabel = 'new'
	) THEN
		ALTER TYPE feedback.feedback_status RENAME VALUE 'new' TO 'submitted';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'feedback' AND e.enumlabel = 'reviewed'
	) THEN
		ALTER TYPE feedback.feedback_status RENAME VALUE 'reviewed' TO 'under_review';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'feedback' AND e.enumlabel = 'done'
	) THEN
		ALTER TYPE feedback.feedback_status RENAME VALUE 'done' TO 'completed';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'feedback' AND e.enumlabel = 'rejected'
	) THEN
		ALTER TYPE feedback.feedback_status RENAME VALUE 'rejected' TO 'declined';
	END IF;
END
$$;

-- 2. Default für status auf den neuen Wert setzen.
ALTER TABLE feedback.user_feedback ALTER COLUMN status SET DEFAULT 'submitted';

-- 3. Neue Category für Onboarding-Wishes anlegen.
ALTER TYPE feedback.feedback_category ADD VALUE IF NOT EXISTS 'onboarding-wish';

COMMIT;
