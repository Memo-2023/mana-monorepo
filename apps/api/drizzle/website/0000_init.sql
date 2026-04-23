-- Website module — initial schema (manually authored to match
-- apps/api/src/modules/website/schema.ts).
--
-- Lives in mana_platform under its own pgSchema. M2 scope: published
-- snapshots only — editor data (sites/pages/blocks) lives in the
-- generic mana-sync store and is not mirrored here. See
-- docs/plans/website-builder.md §D5 + §D6.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/drizzle/website/0000_init.sql

CREATE SCHEMA IF NOT EXISTS "website";

CREATE TABLE IF NOT EXISTS "website"."published_snapshots" (
	"id"            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id"       uuid        NOT NULL,
	"slug"          text        NOT NULL,
	"blob"          jsonb       NOT NULL,
	"is_current"    boolean     NOT NULL DEFAULT false,
	"published_at"  timestamptz NOT NULL DEFAULT now(),
	"published_by"  uuid        NOT NULL,
	"space_id"      uuid
);

-- Rollback / history query path: "all snapshots of this site, newest first".
CREATE INDEX IF NOT EXISTS "published_snapshots_site_idx"
	ON "website"."published_snapshots" ("site_id", "published_at" DESC);

-- Public resolver path: "current snapshot by slug".
CREATE INDEX IF NOT EXISTS "published_snapshots_slug_current_idx"
	ON "website"."published_snapshots" ("slug", "is_current");

-- Hard invariant: exactly one current row per slug. The publish endpoint
-- wraps the old→false + new→true flip in a transaction; this partial
-- unique index catches any code path that would violate it.
CREATE UNIQUE INDEX IF NOT EXISTS "published_snapshots_slug_current_unique_idx"
	ON "website"."published_snapshots" ("slug")
	WHERE "is_current" = true;
