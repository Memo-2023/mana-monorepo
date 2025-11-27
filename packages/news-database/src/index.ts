import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Re-export schema and types
export * from './schema';
export { sql, eq, and, or, desc, asc, isNull, isNotNull, inArray } from 'drizzle-orm';

// Export schema for use in drizzle initialization
export { schema };

// Type for the database instance with schema
export type Database = PostgresJsDatabase<typeof schema>;

// Helper to create a new database connection
export function createDb(url: string): Database {
	const client = postgres(url);
	return drizzle(client, { schema });
}
