import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let connection: ReturnType<typeof postgres> | null = null;

export function getDb(connectionString?: string) {
	if (db) return db;

	const url = connectionString || process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL is not defined');
	}

	connection = postgres(url, {
		max: 10,
		idle_timeout: 20,
		connect_timeout: 10,
	});

	db = drizzle(connection, { schema });
	return db;
}

export function getConnection() {
	return connection;
}

export async function closeConnection() {
	if (connection) {
		await connection.end();
		connection = null;
		db = null;
	}
}

export type Database = ReturnType<typeof getDb>;
