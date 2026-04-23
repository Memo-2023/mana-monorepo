-- 007_passkey_bootstrap.sql
--
-- Aligns auth.passkeys with the expected schema of
-- `@better-auth/passkey` (1.6+) and extends auth.login_attempts with
-- a `method` column so passkey failures can be bucketed separately
-- from password failures for rate-limit/lockout accounting.
--
-- Idempotent. Safe to re-run against a fresh or partially-migrated
-- dev database. No destructive drops — we only ADD or RENAME.
--
-- Applied via psql (not drizzle-kit push) because:
--   - drizzle-kit push treats column renames as drop + add unless
--     confirmed interactively, which would delete existing passkey
--     rows if there were any;
--   - adding NOT NULL / DEFAULT in a push without a USING clause
--     fails against tables with existing rows.
--
-- Usage (dev):
--   docker exec -i mana-postgres psql -U mana -d mana_platform \
--     < services/mana-auth/sql/007_passkey_bootstrap.sql
--
-- Production: run under migrations tooling once the pattern exists.
-- The mana-auth CLAUDE.md notes the repo convention that hand-
-- authored SQL migrations under sql/ are applied by hand.

BEGIN;

-- ─── Passkey schema alignment ──────────────────────────────────

-- friendly_name → name
-- Better Auth's plugin schema calls the column `name`. Rename
-- without dropping so any rows survive (none expected in dev, but
-- the migration is idempotent regardless).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'passkeys'
      AND column_name = 'friendly_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'passkeys'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE auth.passkeys RENAME COLUMN friendly_name TO name;
  END IF;
END $$;

-- Add aaguid — the authenticator AAGUID is optional in WebAuthn but
-- required by Better Auth's schema. Nullable so existing rows (if
-- any) stay valid.
ALTER TABLE auth.passkeys ADD COLUMN IF NOT EXISTS aaguid text;

-- Convert transports from jsonb to text (CSV of AuthenticatorTransport
-- values). Better Auth stores it as a plain string like
-- "usb,nfc,hybrid"; jsonb would force the plugin to JSON.parse on
-- every read.
--
-- Postgres forbids subqueries directly in ALTER TABLE … USING, so
-- we stage the conversion through a dedicated helper function (which
-- can freely contain subqueries) and drop the function after use.
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'passkeys'
    AND column_name = 'transports';

  IF current_type = 'jsonb' THEN
    CREATE OR REPLACE FUNCTION pg_temp.jsonb_array_to_csv(j jsonb)
    RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
      SELECT CASE
        WHEN j IS NULL THEN NULL
        WHEN jsonb_typeof(j) = 'array' THEN (
          SELECT string_agg(value, ',')
          FROM jsonb_array_elements_text(j) AS value
        )
        ELSE j::text
      END
    $fn$;

    ALTER TABLE auth.passkeys
      ALTER COLUMN transports TYPE text
      USING (pg_temp.jsonb_array_to_csv(transports));
  END IF;
END $$;

-- ─── Lockout table: method column ──────────────────────────────

-- Bucket login attempts by auth method so passkey + password + 2FA
-- failures can be counted / rate-limited independently. Default
-- 'password' for the existing pre-passkey column — that's historically
-- what any prior row represented.
ALTER TABLE auth.login_attempts
  ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'password';

-- Replace the existing (email, attempted_at) index with one that
-- also covers method, so lockout checks filter without a sequential
-- scan. Using IF NOT EXISTS on the new index and dropping the old
-- one afterwards keeps the migration re-runnable.
CREATE INDEX IF NOT EXISTS login_attempts_email_method_time_idx
  ON auth.login_attempts (email, method, attempted_at);

-- The old (email, attempted_at) index becomes redundant once the new
-- one exists (queries on email+method still use the new one).
DROP INDEX IF EXISTS auth.login_attempts_email_attempted_at_idx;

COMMIT;
