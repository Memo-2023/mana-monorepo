-- Migration 004: Spaces schema
--
-- Adds the `spaces` schema with two server-side tables that extend Better
-- Auth organizations for our multi-tenancy model. See
-- docs/plans/spaces-foundation.md for the full RFC, and the Drizzle
-- definitions at src/db/schema/spaces.ts.
--
-- Why a separate schema:
--   - Keeps auth tables focused on identity, not domain extensions
--   - Lets us grant narrower RLS policies per schema
--   - Mirrors the pgSchema-per-concern pattern used across mana_platform
--
-- Idempotent: re-running on a partially-migrated DB is safe.

-- ─── Schema ──────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS spaces;

-- ─── credentials ────────────────────────────────────────────────
-- Per-space external credentials: OAuth tokens, API keys, SMTP configs.
-- NEVER stored client-side — these are server-held secrets, wrapped with
-- the service-wide KEK (same mechanism as auth.encryption_vaults).
CREATE TABLE IF NOT EXISTS spaces.credentials (
    space_id                  TEXT        NOT NULL,
    provider                  TEXT        NOT NULL,
    access_token_encrypted    TEXT        NOT NULL,
    refresh_token_encrypted   TEXT,
    expires_at                TIMESTAMPTZ,
    scopes                    TEXT[],
    provider_account_id       TEXT,
    metadata_json             TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (space_id, provider),
    CONSTRAINT space_credentials_space_fk
        FOREIGN KEY (space_id) REFERENCES auth.organizations (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS space_credentials_space_idx
    ON spaces.credentials (space_id);

-- ─── module_permissions ─────────────────────────────────────────
-- Role × module permission matrix. If no row exists for a given
-- (space, role, module) tuple, the default is derived from SPACE_MODULE_ALLOWLIST
-- plus role-tier fallback (owner > admin > member). Rows here are
-- explicit overrides — typically written when a space owner customises
-- the default permissions for a custom role.
CREATE TABLE IF NOT EXISTS spaces.module_permissions (
    space_id   TEXT        NOT NULL,
    role       TEXT        NOT NULL,
    module_id  TEXT        NOT NULL,
    can_read   BOOLEAN     NOT NULL DEFAULT TRUE,
    can_write  BOOLEAN     NOT NULL DEFAULT FALSE,
    can_admin  BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (space_id, role, module_id),
    CONSTRAINT space_module_permissions_space_fk
        FOREIGN KEY (space_id) REFERENCES auth.organizations (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS space_module_permissions_space_module_idx
    ON spaces.module_permissions (space_id, module_id);

-- ─── RLS ─────────────────────────────────────────────────────────
-- Defer enabling RLS until the rest of the app is scope-aware. Turning
-- it on now would lock out services that don't yet pass the space
-- context. Re-enable in a follow-up migration once mana-api speaks the
-- Spaces protocol end-to-end.
--
-- ALTER TABLE spaces.credentials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE spaces.module_permissions ENABLE ROW LEVEL SECURITY;
