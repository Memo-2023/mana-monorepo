/**
 * Drizzle ORM database connection factory for Hono servers.
 *
 * Provides a lightweight connection with sensible defaults.
 * Each server defines its own minimal schema (only tables it needs).
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export interface DbOptions {
	/** PostgreSQL connection URL */
	url?: string;
	/** Max connections (default: 5) */
	maxConnections?: number;
	/** Idle timeout in seconds (default: 20) */
	idleTimeout?: number;
}

/**
 * Create a Drizzle database instance with postgres.js driver.
 *
 * Usage:
 * ```ts
 * import { createDb } from '@manacore/shared-hono/db';
 * import { tasks, projects } from './schema';
 *
 * const db = createDb({
 *   schema: { tasks, projects },
 * });
 * ```
 */
export function createDb<TSchema extends Record<string, unknown>>(
	opts?: DbOptions & { schema?: TSchema }
) {
	const url =
		opts?.url ??
		process.env.DATABASE_URL ??
		'postgresql://manacore:devpassword@localhost:5432/mana_platform';

	const connection = postgres(url, {
		max: opts?.maxConnections ?? 5,
		idle_timeout: opts?.idleTimeout ?? 20,
	});

	return drizzle(connection, {
		schema: opts?.schema as TSchema,
	});
}
