-- Migration: encryption_vaults + encryption_vault_audit
--
-- Adds the per-user encryption vault that holds each user's master key
-- (MK) wrapped with a service-wide Key Encryption Key (KEK). The KEK
-- itself never lives in the database — it is loaded from the
-- MANA_AUTH_KEK env var (later: a KMS / Vault).
--
-- Run this BEFORE deploying the encryption Phase 2 mana-auth release.
-- After this migration, run `pnpm db:push` from services/mana-auth/
-- to materialize the Drizzle-defined columns (or just deploy the new
-- service — Drizzle creates the tables on boot).
--
-- The Drizzle schema definition lives in
-- src/db/schema/encryption-vaults.ts. This SQL file only adds the
-- bits Drizzle cannot model: row-level security policies + the FORCE
-- option that makes the policies apply even to the table owner.

-- ─── Tables ───────────────────────────────────────────────────
-- Table CREATE statements are intentionally idempotent so this file
-- can be re-run on a partially-migrated database without crashing.

CREATE TABLE IF NOT EXISTS auth.encryption_vaults (
    user_id         TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wrapped_mk      TEXT NOT NULL,
    wrap_iv         TEXT NOT NULL,
    format_version  SMALLINT NOT NULL DEFAULT 1,
    kek_id          TEXT NOT NULL DEFAULT 'env-v1',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS encryption_vaults_user_id_idx
    ON auth.encryption_vaults (user_id);

CREATE TABLE IF NOT EXISTS auth.encryption_vault_audit (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    ip_address      TEXT,
    user_agent      TEXT,
    context         TEXT,
    status          INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS encryption_vault_audit_user_id_idx
    ON auth.encryption_vault_audit (user_id);

CREATE INDEX IF NOT EXISTS encryption_vault_audit_created_at_idx
    ON auth.encryption_vault_audit (created_at);

-- ─── Row Level Security ───────────────────────────────────────
--
-- Defense-in-depth: even if a future query forgets the WHERE
-- user_id = $1 clause, the database itself refuses to leak rows
-- belonging to other users. The vault service wraps every read
-- and write in a transaction that calls
--   set_config('app.current_user_id', userId, true)
-- before touching the table — RLS rejects anything else.
--
-- FORCE makes the policy apply to the table owner too, so the
-- mana-auth service role cannot bypass it via grants alone.

ALTER TABLE auth.encryption_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.encryption_vaults FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS encryption_vaults_user_isolation ON auth.encryption_vaults;
CREATE POLICY encryption_vaults_user_isolation ON auth.encryption_vaults
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE auth.encryption_vault_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.encryption_vault_audit FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS encryption_vault_audit_user_isolation ON auth.encryption_vault_audit;
CREATE POLICY encryption_vault_audit_user_isolation ON auth.encryption_vault_audit
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));
