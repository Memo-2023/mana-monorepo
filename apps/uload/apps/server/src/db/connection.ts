import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb(databaseUrl: string) {
	if (!db) {
		const client = postgres(databaseUrl, { max: 10 });
		db = drizzle(client);
	}
	return db;
}

export type Database = ReturnType<typeof getDb>;
