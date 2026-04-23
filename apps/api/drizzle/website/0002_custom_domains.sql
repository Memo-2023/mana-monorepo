-- Website module — M6 custom-domain bindings.
-- See docs/plans/website-builder.md §M6.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/drizzle/website/0002_custom_domains.sql

CREATE TABLE IF NOT EXISTS "website"."custom_domains" (
	"id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	"site_id"             uuid        NOT NULL,
	"hostname"            text        NOT NULL UNIQUE,
	"status"              text        NOT NULL DEFAULT 'pending',
	"verification_token"  text        NOT NULL,
	"dns_target"          text        NOT NULL DEFAULT 'custom.mana.how',
	"error_message"       text,
	"verified_at"         timestamptz,
	"created_at"          timestamptz NOT NULL DEFAULT now(),
	"updated_at"          timestamptz NOT NULL DEFAULT now(),
	"created_by"          uuid        NOT NULL
);

CREATE INDEX IF NOT EXISTS "custom_domains_site_idx"
	ON "website"."custom_domains" ("site_id", "status");

-- Partial unique index: only ONE verified binding per hostname. The
-- hostname-unique constraint above prevents duplicates across all
-- statuses; this partial is redundant as written (unique already
-- covers it), kept here as an invariant-docs comment. If we ever drop
-- the global unique (e.g. to allow one user to re-add a domain another
-- user abandoned), this becomes the load-bearing constraint.
CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_verified_hostname_idx"
	ON "website"."custom_domains" ("hostname")
	WHERE "status" = 'verified';
