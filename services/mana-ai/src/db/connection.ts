/**
 * Thin `postgres.js` wrapper for the mana_sync database.
 *
 * We read `sync_changes` rows directly — the service is a pure consumer;
 * no schema of its own (yet). Missions live as events here, replayed into
 * a materialized shape in `missions-projection.ts`.
 */

import postgres from 'postgres';

export type Sql = postgres.Sql<Record<string, never>>;

let _sql: Sql | null = null;

export function getSql(databaseUrl: string): Sql {
	if (_sql) return _sql;
	_sql = postgres(databaseUrl, {
		// Short idle timeout keeps connection count low; the tick is a
		// cron-style pattern, not a hot path.
		idle_timeout: 30,
		max: 4,
	});
	return _sql;
}

export async function closeSql(): Promise<void> {
	if (_sql) {
		await _sql.end({ timeout: 5 });
		_sql = null;
	}
}
