-- Website module — M4 form submissions.
-- See docs/plans/website-builder.md §M4 + §D8.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/drizzle/website/0001_submissions.sql

CREATE TABLE IF NOT EXISTS "website"."submissions" (
	"id"                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id"           uuid        NOT NULL,
	"block_id"          uuid        NOT NULL,
	"payload"           jsonb       NOT NULL,
	"target_module"     text        NOT NULL,
	"target_action"     text        NOT NULL,
	"target_record_id"  uuid,
	"status"            text        NOT NULL,
	"error_message"     text,
	"ip"                text,
	"user_agent"        text,
	"created_at"        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "submissions_site_created_idx"
	ON "website"."submissions" ("site_id", "created_at" DESC);
