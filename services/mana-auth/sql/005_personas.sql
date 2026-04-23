-- Migration 005: Personas
--
-- Adds the three `auth.personas*` tables introduced by the M2.a–c MCP
-- work (feat commit 493db0c3b). See docs/plans/mana-mcp-and-personas.md
-- for the full spec, and src/db/schema/personas.ts for the Drizzle
-- definitions.
--
-- A `persona` is an auto-driven user (archetype + system prompt + module
-- mix) that goes through the normal auth/register/JWT pipeline — kept in
-- the auth schema so foreign keys to `auth.users` stay straightforward.
-- The companion tables are append-only:
--   - persona_actions: every MCP tool call the runner makes
--   - persona_feedback: module-scoped quality ratings emitted per tick
--
-- This SQL matches what drizzle-kit push would emit for personas.ts. We
-- apply it manually because the other tables created alongside personas
-- (spaces.credentials, spaces.module_permissions) live outside the auth
-- schemaFilter and pre-existing public enums would otherwise trip the
-- push. See migration 006 for the follow-up that makes push clean.
--
-- Idempotent: re-running on a partially-migrated DB is safe.

-- ─── personas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.personas (
    user_id         TEXT        PRIMARY KEY NOT NULL,
    archetype       TEXT        NOT NULL,
    system_prompt   TEXT        NOT NULL,
    module_mix      JSONB       NOT NULL,
    tick_cadence    TEXT        NOT NULL DEFAULT 'daily',
    last_active_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT personas_user_id_users_id_fk
        FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS personas_archetype_idx
    ON auth.personas (archetype);

-- ─── persona_actions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.persona_actions (
    id             TEXT        PRIMARY KEY NOT NULL,
    persona_id     TEXT        NOT NULL,
    tick_id        TEXT        NOT NULL,
    tool_name      TEXT        NOT NULL,
    input_hash     TEXT,
    result         TEXT        NOT NULL,
    error_message  TEXT,
    latency_ms     INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT persona_actions_persona_id_personas_user_id_fk
        FOREIGN KEY (persona_id) REFERENCES auth.personas (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS persona_actions_persona_idx
    ON auth.persona_actions (persona_id, created_at);

CREATE INDEX IF NOT EXISTS persona_actions_tick_idx
    ON auth.persona_actions (tick_id);

-- ─── persona_feedback ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth.persona_feedback (
    id          TEXT        PRIMARY KEY NOT NULL,
    persona_id  TEXT        NOT NULL,
    tick_id     TEXT        NOT NULL,
    module      TEXT        NOT NULL,
    rating      SMALLINT    NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT persona_feedback_persona_id_personas_user_id_fk
        FOREIGN KEY (persona_id) REFERENCES auth.personas (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS persona_feedback_persona_idx
    ON auth.persona_feedback (persona_id, created_at);

CREATE INDEX IF NOT EXISTS persona_feedback_module_idx
    ON auth.persona_feedback (module, created_at);
