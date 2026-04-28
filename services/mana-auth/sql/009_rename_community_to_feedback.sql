-- 009_rename_community_to_feedback.sql
-- Renames the two identity-opt-in columns on auth.users to match the
-- "feedback" brand the public hub now carries. Was originally added
-- in 008_community_identity.sql.
--
-- Apply with:
--   psql "$DATABASE_URL" -f sql/009_rename_community_to_feedback.sql

BEGIN;

ALTER TABLE auth.users
	RENAME COLUMN community_show_real_name TO feedback_show_real_name;

ALTER TABLE auth.users
	RENAME COLUMN community_karma TO feedback_karma;

COMMIT;
