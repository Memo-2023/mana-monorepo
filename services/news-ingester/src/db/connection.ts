/**
 * Single Postgres connection pool, lazily instantiated.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(databaseUrl: string) {
	if (!db) {
		const client = postgres(databaseUrl, { max: 5 });
		db = drizzle(client, { schema });
	}
	return db;
}

export type Database = ReturnType<typeof getDb>;
