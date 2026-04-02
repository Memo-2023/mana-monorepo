import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(url: string) {
	if (!db) {
		const client = postgres(url, { max: 10 });
		db = drizzle(client, { schema });
	}
	return db;
}

export type Database = ReturnType<typeof getDb>;
