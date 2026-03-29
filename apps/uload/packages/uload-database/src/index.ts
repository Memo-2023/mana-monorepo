import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

// Re-export drizzle operators used by the backend
export { eq, and, or, desc, sql, gte, lte, ilike } from 'drizzle-orm';

// Database instance type
export type Database = ReturnType<typeof getDb>;

// Infer types for backend services
export type Link = typeof schema.links.$inferSelect;
export type NewLink = typeof schema.links.$inferInsert;
export type Click = typeof schema.clicks.$inferSelect;
export type NewClick = typeof schema.clicks.$inferInsert;

let db: Database | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
	if (!db) {
		const connectionString =
			process.env.DATABASE_URL ||
			'postgresql://uload:uload_dev_password_123@localhost:5432/uload_dev';

		client = postgres(connectionString, {
			max: 10,
			idle_timeout: 20,
			connect_timeout: 10,
		});

		db = drizzle(client, { schema });
	}
	return db!;
}

export async function closeDb(): Promise<void> {
	if (client) {
		await client.end();
		client = null;
		db = null;
	}
}
