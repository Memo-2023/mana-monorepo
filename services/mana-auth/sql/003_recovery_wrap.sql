-- Migration: encryption_vaults recovery wrap + zero-knowledge mode
--
-- Phase 9 of the encryption rollout. Adds three new columns + makes
-- wrapped_mk nullable so a user can opt into "true zero-knowledge"
-- mode where the server can no longer decrypt their data.
--
-- The opt-in flow is:
--   1. Client generates a 32-byte recovery secret (client-only)
--   2. Client wraps the existing master key with a recovery-derived key
--   3. Client posts the wrapped MK + IV to /me/encryption-vault/recovery-wrap
--   4. The server stores recovery_wrapped_mk + recovery_iv (both NULLABLE
--      until the user enables the recovery wrap; both NOT NULL once set)
--   5. Client posts /me/encryption-vault/zero-knowledge with `enable: true`
--      The server NULLs out wrapped_mk + wrap_iv, sets zero_knowledge=true.
--      The server can no longer decrypt the user's data.
--   6. On the next unlock, GET /key returns the recovery_wrapped_mk blob
--      with `requiresRecoveryCode: true`. The client prompts the user for
--      the recovery code, derives the wrap key, unwraps locally.
--
-- The "disable" flow is the inverse: the client unwraps locally, generates
-- a new server-side wrapped_mk via a fresh KEK wrap, and posts it back.
--
-- Idempotent: re-running on a partially-migrated DB is safe.

-- ─── Add new columns ──────────────────────────────────────────
ALTER TABLE auth.encryption_vaults
    ADD COLUMN IF NOT EXISTS recovery_wrapped_mk    TEXT,
    ADD COLUMN IF NOT EXISTS recovery_iv            TEXT,
    ADD COLUMN IF NOT EXISTS recovery_format_version SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS recovery_set_at        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS zero_knowledge         BOOLEAN NOT NULL DEFAULT false;

-- ─── Make wrapped_mk + wrap_iv nullable ───────────────────────
-- These were NOT NULL in the Phase 2 migration. After Phase 9, a vault
-- in zero-knowledge mode has no server-side wrap at all, so both columns
-- have to allow NULL. Existing rows are unaffected (they have non-NULL
-- values; the constraint just relaxes).

ALTER TABLE auth.encryption_vaults
    ALTER COLUMN wrapped_mk DROP NOT NULL,
    ALTER COLUMN wrap_iv DROP NOT NULL;

-- ─── Sanity constraint ────────────────────────────────────────
-- A vault row must have AT LEAST one usable wrap form, otherwise the
-- user has lost access to their data and we should have rejected the
-- mutation that left the row in this state. The check enforces that
-- at least one of (wrapped_mk, recovery_wrapped_mk) is populated.

ALTER TABLE auth.encryption_vaults
    DROP CONSTRAINT IF EXISTS encryption_vaults_has_wrap;

ALTER TABLE auth.encryption_vaults
    ADD CONSTRAINT encryption_vaults_has_wrap
    CHECK (wrapped_mk IS NOT NULL OR recovery_wrapped_mk IS NOT NULL);

-- ─── Cross-field consistency ──────────────────────────────────
-- If recovery_wrapped_mk is set, recovery_iv must also be set.
-- If wrapped_mk is set, wrap_iv must also be set.

ALTER TABLE auth.encryption_vaults
    DROP CONSTRAINT IF EXISTS encryption_vaults_wrap_iv_pair;

ALTER TABLE auth.encryption_vaults
    ADD CONSTRAINT encryption_vaults_wrap_iv_pair
    CHECK (
        (wrapped_mk IS NULL) = (wrap_iv IS NULL)
        AND
        (recovery_wrapped_mk IS NULL) = (recovery_iv IS NULL)
    );

-- ─── Zero-knowledge implies the server wrap is gone ───────────
-- If a vault is in zero-knowledge mode, the KEK-wrapped MK MUST be
-- absent — otherwise the "server can no longer decrypt" promise is
-- a lie. The recovery wrap MUST be present, otherwise the user is
-- locked out.

ALTER TABLE auth.encryption_vaults
    DROP CONSTRAINT IF EXISTS encryption_vaults_zk_consistency;

ALTER TABLE auth.encryption_vaults
    ADD CONSTRAINT encryption_vaults_zk_consistency
    CHECK (
        (zero_knowledge = false)
        OR
        (zero_knowledge = true AND wrapped_mk IS NULL AND recovery_wrapped_mk IS NOT NULL)
    );
