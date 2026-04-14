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

/**
 * Run `fn` inside a transaction scoped to the given user_id via the same
 * RLS convention mana-sync's Go `withUser` uses: set the session-local
 * `app.current_user_id` setting so the existing `sync_changes_user_isolation`
 * policy only exposes that user's rows.
 *
 * Empty userIDs are refused up front — an unauthenticated caller must
 * never reach the DB with an empty RLS scope (which would match every
 * row the policy allows).
 */
export async function withUser<T>(
	sql: Sql,
	userId: string,
	fn: (tx: postgres.TransactionSql) => Promise<T>
): Promise<T> {
	if (!userId) throw new Error('withUser: empty userID');
	return sql.begin(async (tx) => {
		await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
		return fn(tx);
	}) as Promise<T>;
}
