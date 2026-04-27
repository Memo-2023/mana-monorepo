-- 008_community_identity.sql
--
-- Phase 3.C von docs/plans/feedback-rewards-and-identity.md.
--
-- Community-Hub Opt-Ins für jeden User:
--  - community_show_real_name: legt offen, ob der echte name neben
--    der eulen-pseudonym im community-feed angezeigt wird (default off).
--  - community_karma: counter — eine pro Reaction die jemand auf einen
--    eigenen Post macht. Treibt die Bronze/Silver/Gold/Platin-Tier-Badge.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f services/mana-auth/sql/008_community_identity.sql

BEGIN;

ALTER TABLE auth.users
	ADD COLUMN IF NOT EXISTS community_show_real_name boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS community_karma integer NOT NULL DEFAULT 0;

COMMIT;
