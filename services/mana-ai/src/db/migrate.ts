/**
 * Schema migration for mana-ai's own derived state.
 *
 * Per the service's contract, mana-ai reads `sync_changes` (owned by
 * mana-sync) and writes back to it through the public sync protocol.
 * It doesn't own that schema. But it DOES need a small amount of
 * persistent derived state — notably the mission snapshot table that
 * caches LWW-merged records so the tick loop doesn't scan the full
 * event log every minute.
 *
 * Such derived state lives in the `mana_ai` schema in the same
 * Postgres database (`mana_sync`). One schema, one migration, called
 * idempotently on service boot.
 */

import type { Sql } from './connection';

export async function migrate(sql: Sql): Promise<void> {
	await sql`CREATE SCHEMA IF NOT EXISTS mana_ai`;

	await sql`
		CREATE TABLE IF NOT EXISTS mana_ai.mission_snapshots (
			user_id TEXT NOT NULL,
			mission_id TEXT NOT NULL,
			record JSONB NOT NULL,
			last_applied_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch',
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			PRIMARY KEY (user_id, mission_id)
		)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS idx_mission_snapshots_due
		ON mana_ai.mission_snapshots ((record->>'state'), (record->>'nextRunAt'))
		WHERE record->>'state' = 'active'
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS idx_mission_snapshots_user
		ON mana_ai.mission_snapshots (user_id, last_applied_at)
	`;

	// ─── Mission Grant decrypt audit ─────────────────────────────
	// Every server-side decrypt of an encrypted record (triggered by a
	// Mission with a valid Grant) writes one row here. Surfaces in the
	// webapp under "Mission → Datenzugriff" so the user can see exactly
	// what the runner has read. Keep the row shape flat + append-only;
	// never mutate after insert.
	//
	// Why in mana_ai and not mana-auth? The write originates here and
	// the read is operator-scoped to a specific mission — keeping it
	// adjacent to `mission_snapshots` means `withUser` transactions
	// already have the right RLS set up.
	await sql`
		CREATE TABLE IF NOT EXISTS mana_ai.decrypt_audit (
			id BIGSERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			mission_id TEXT NOT NULL,
			iteration_id TEXT,
			table_name TEXT NOT NULL,
			record_id TEXT NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('ok', 'failed', 'scope-violation')),
			reason TEXT,
			ts TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS idx_decrypt_audit_mission
		ON mana_ai.decrypt_audit (user_id, mission_id, ts DESC)
	`;

	// Mirror the RLS pattern used on sync_changes / mission_snapshots:
	// every read goes through a `withUser` transaction that sets
	// `app.user_id`; the policy gates row visibility to that user.
	await sql`ALTER TABLE mana_ai.decrypt_audit ENABLE ROW LEVEL SECURITY`;

	await sql`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_policies
				WHERE schemaname = 'mana_ai'
				  AND tablename = 'decrypt_audit'
				  AND policyname = 'decrypt_audit_user_scope'
			) THEN
				CREATE POLICY decrypt_audit_user_scope ON mana_ai.decrypt_audit
					USING (user_id = current_setting('app.current_user_id', true));
			END IF;
		END $$
	`;

	// ─── Agent snapshots (Multi-Agent Workbench, Phase 3) ────────
	// Mirrors mission_snapshots: a materialized LWW-merged view of the
	// agents table from sync_changes. Runner loads agents per-user
	// per-tick from here instead of replaying the event log each time.
	// systemPrompt + memory stay as they arrived (encrypted strings for
	// most users); the runner opts to skip injecting ciphertext rather
	// than requiring a per-agent Grant.
	await sql`
		CREATE TABLE IF NOT EXISTS mana_ai.agent_snapshots (
			user_id TEXT NOT NULL,
			agent_id TEXT NOT NULL,
			record JSONB NOT NULL,
			last_applied_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch',
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			PRIMARY KEY (user_id, agent_id)
		)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS idx_agent_snapshots_user
		ON mana_ai.agent_snapshots (user_id, last_applied_at)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS idx_agent_snapshots_state
		ON mana_ai.agent_snapshots ((record->>'state'))
		WHERE record->>'state' = 'active'
	`;
}
