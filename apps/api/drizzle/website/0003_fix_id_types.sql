-- Website module — fix id column types.
--
-- `published_by`, `created_by`, and `space_id` were originally declared
-- as `uuid`, but Mana user ids (auth.users.id) and space ids
-- (auth.organizations.id) are Better-Auth nanoids stored as `text`.
-- Publishing failed with `invalid input syntax for type uuid`.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/drizzle/website/0003_fix_id_types.sql

ALTER TABLE "website"."published_snapshots"
	ALTER COLUMN "published_by" TYPE text;

ALTER TABLE "website"."published_snapshots"
	ALTER COLUMN "space_id" TYPE text;

ALTER TABLE "website"."custom_domains"
	ALTER COLUMN "created_by" TYPE text;
