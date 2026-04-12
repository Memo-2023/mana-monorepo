/**
 * Shared database connection pool for mana-api.
 *
 * All modules share a single connection pool instead of each creating
 * their own. The pool is created lazily on first call and reused.
 *
 * Usage:
 * ```ts
 * import { getConnection } from '../../lib/db';
 * import { drizzle } from 'drizzle-orm/postgres-js';
 *
 * const db = drizzle(getConnection(), { schema: { ... } });
 * ```
 */

import postgres from 'postgres';

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://mana:devpassword@localhost:5432/mana_platform';

let pool: ReturnType<typeof postgres> | null = null;

/**
 * Returns the shared postgres connection pool.
 * Created lazily with sensible defaults (max 10 connections).
 */
export function getConnection() {
	if (!pool) {
		pool = postgres(DATABASE_URL, { max: 10, idle_timeout: 30 });
	}
	return pool;
}
