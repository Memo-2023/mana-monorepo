import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let connection: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb(databaseUrl: string) {
	if (!db) {
		connection = postgres(databaseUrl, {
			max: 10,
			idle_timeout: 20,
			connect_timeout: 10,
		});
		db = drizzle(connection, { schema });
	}
	return db;
}

export async function closeConnection() {
	if (connection) {
		await connection.end();
		connection = null;
		db = null;
	}
}

export type Database = ReturnType<typeof getDb>;
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
