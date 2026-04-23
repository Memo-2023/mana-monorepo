-- Migration 006: Move Better Auth enums from `public` to `auth` schema
--
-- Background: mana-auth's drizzle.config.ts uses schemaFilter: ['auth'],
-- which restricts introspection to the auth schema. Enums declared via
-- the module-level `pgEnum(...)` factory default to `public`, which the
-- filter hides. Result: every `drizzle-kit push` would re-emit
-- CREATE TYPE access_tier ... and fail with 42710 ("type already
-- exists"). That blocked setup-databases.sh from advancing mana-auth
-- past enum declarations and masked subsequent schema drift (e.g. the
-- `kind` column from persona work going un-pushed).
--
-- Fix: move the three enums into the auth schema itself. Source-side
-- this is `authSchema.enum(...)` instead of `pgEnum(...)`. DB-side this
-- migration recreates the types in auth, repoints the two columns that
-- reference them, then drops the old public types.
--
-- Scope of affected columns (verified 2026-04-23):
--   - auth.users.access_tier → access_tier
--   - auth.users.role        → user_role
--   (user_kind has no column uses yet; the type is created in auth
--    preemptively so the next schema push doesn't try to create it in
--    public.)
--
-- Idempotent: re-running on an already-migrated DB is a no-op for the
-- column changes; the CREATE TYPE statements use guarded DO blocks.

BEGIN;

-- 1. Create the new types in auth (guarded so re-runs don't fail).
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'auth' AND t.typname = 'access_tier'
    ) THEN
        CREATE TYPE auth.access_tier AS ENUM ('guest', 'public', 'beta', 'alpha', 'founder');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'auth' AND t.typname = 'user_role'
    ) THEN
        CREATE TYPE auth.user_role AS ENUM ('user', 'admin', 'service');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'auth' AND t.typname = 'user_kind'
    ) THEN
        CREATE TYPE auth.user_kind AS ENUM ('human', 'persona', 'system');
    END IF;
END $$;

-- 2. Repoint the two existing columns. Only runs if the column still
--    uses the old public type — the `format_type` check keeps this
--    idempotent.
DO $$ BEGIN
    IF (SELECT format_type(a.atttypid, a.atttypmod)
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users' AND a.attname = 'access_tier'
       ) = 'access_tier' THEN
        ALTER TABLE auth.users ALTER COLUMN access_tier DROP DEFAULT;
        ALTER TABLE auth.users
            ALTER COLUMN access_tier TYPE auth.access_tier
            USING access_tier::text::auth.access_tier;
        ALTER TABLE auth.users ALTER COLUMN access_tier SET DEFAULT 'public'::auth.access_tier;
    END IF;

    IF (SELECT format_type(a.atttypid, a.atttypmod)
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users' AND a.attname = 'role'
       ) = 'user_role' THEN
        ALTER TABLE auth.users ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE auth.users
            ALTER COLUMN role TYPE auth.user_role
            USING role::text::auth.user_role;
        ALTER TABLE auth.users ALTER COLUMN role SET DEFAULT 'user'::auth.user_role;
    END IF;
END $$;

-- 3. Drop the now-unreferenced public types. DROP TYPE IF EXISTS is
--    safe if someone re-runs this after they were already dropped.
DROP TYPE IF EXISTS public.access_tier;
DROP TYPE IF EXISTS public.user_role;
-- Note: public.user_kind was never created (no prior migration emitted
-- it), so no DROP is needed.

COMMIT;
