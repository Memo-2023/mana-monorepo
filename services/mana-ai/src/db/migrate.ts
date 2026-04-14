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
}
