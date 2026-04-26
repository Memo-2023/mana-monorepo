-- 0001_align-feedback-enums.sql
--
-- Bringt die Postgres-Enums `feedback_category` und `feedback_status`
-- mit dem `@mana/feedback`-Package in Einklang und legt die
-- `onboarding-wish`-Kategorie für den letzten Onboarding-Schritt an.
--
-- Schema-Hinweis: Die Enum-Typen leben in `public`, nicht in `feedback`.
-- Das ist der bekannte Drizzle-pgEnum-Drift (siehe Repo-Memory:
-- "Drizzle enums with schemaFilter must use pgSchema().enum()") —
-- pgEnum() ohne pgSchema-Wrap landet immer in public, der schemaFilter
-- versteckt sie nur im Schema-Diff. Die Tabelle `feedback.user_feedback`
-- referenziert die Enum-Typen aus public, das funktioniert. Mittelfristig
-- sollte das Schema auf feedbackSchema.enum(...) umgestellt werden — das
-- ist aber ein separater Refactor (alte Enum droppen, neue bauen,
-- Spalten umstellen) und nicht Teil dieser Migration.
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
		WHERE t.typname = 'feedback_status' AND n.nspname = 'public' AND e.enumlabel = 'new'
	) THEN
		ALTER TYPE public.feedback_status RENAME VALUE 'new' TO 'submitted';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'public' AND e.enumlabel = 'reviewed'
	) THEN
		ALTER TYPE public.feedback_status RENAME VALUE 'reviewed' TO 'under_review';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'public' AND e.enumlabel = 'done'
	) THEN
		ALTER TYPE public.feedback_status RENAME VALUE 'done' TO 'completed';
	END IF;

	IF EXISTS (
		SELECT 1 FROM pg_enum e
		JOIN pg_type t ON t.oid = e.enumtypid
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'feedback_status' AND n.nspname = 'public' AND e.enumlabel = 'rejected'
	) THEN
		ALTER TYPE public.feedback_status RENAME VALUE 'rejected' TO 'declined';
	END IF;
END
$$;

-- 2. Default für status auf den neuen Wert setzen.
ALTER TABLE feedback.user_feedback ALTER COLUMN status SET DEFAULT 'submitted';

-- 3. Neue Category für Onboarding-Wishes anlegen.
ALTER TYPE public.feedback_category ADD VALUE IF NOT EXISTS 'onboarding-wish';

COMMIT;
