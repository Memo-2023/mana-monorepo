-- Unlisted Snapshots — schema bootstrap.
-- See docs/plans/unlisted-sharing.md §1.
--
-- Apply with:
--   docker exec -i mana-postgres psql -U mana -d mana_platform \
--     < apps/api/drizzle/unlisted/0000_init.sql

CREATE SCHEMA IF NOT EXISTS "unlisted";

CREATE TABLE IF NOT EXISTS "unlisted"."snapshots" (
	"token"                 text        PRIMARY KEY,
	"user_id"               text        NOT NULL,
	"space_id"              text        NOT NULL,
	"collection"            text        NOT NULL,
	"record_id"             uuid        NOT NULL,
	"blob"                  jsonb       NOT NULL,
	"created_at"            timestamptz NOT NULL DEFAULT now(),
	"updated_at"            timestamptz NOT NULL DEFAULT now(),
	"expires_at"            timestamptz,
	"revoked_at"            timestamptz
);

-- One active token per record (user + collection + recordId).
-- revoked rows are allowed to coexist because re-publish after revoke
-- should mint a fresh token row instead of updating the old one.
CREATE UNIQUE INDEX IF NOT EXISTS "snapshots_record_active_idx"
	ON "unlisted"."snapshots" ("user_id", "collection", "record_id")
	WHERE "revoked_at" IS NULL;

-- Expiry-cleanup path: cron scans for snapshots past expires_at.
CREATE INDEX IF NOT EXISTS "snapshots_expiry_idx"
	ON "unlisted"."snapshots" ("expires_at")
	WHERE "expires_at" IS NOT NULL AND "revoked_at" IS NULL;
