import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// Singleton instance for the database client
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pgClient: ReturnType<typeof postgres> | null = null;

/**
 * Get the database URL from environment variables
 */
function getDatabaseUrl(): string {
	const url = process.env.DATABASE_URL || process.env.CARDS_DATABASE_URL;
	if (!url) {
		throw new Error(
			'Database URL not found. Set DATABASE_URL or CARDS_DATABASE_URL environment variable.'
		);
	}
	return url;
}

/**
 * Create a new database client
 * Uses connection pooling with sensible defaults for serverless environments
 */
export function createClient(connectionString?: string) {
	const url = connectionString || getDatabaseUrl();

	const client = postgres(url, {
		max: 10, // Maximum connections in the pool
		idle_timeout: 20, // Close idle connections after 20 seconds
		connect_timeout: 10, // Connection timeout in seconds
		prepare: false, // Disable prepared statements for serverless
	});

	return drizzle(client, { schema });
}

/**
 * Get the singleton database instance
 * Creates a new instance if one doesn't exist
 */
export function getDb() {
	if (!dbInstance) {
		const url = getDatabaseUrl();
		pgClient = postgres(url, {
			max: 10,
			idle_timeout: 20,
			connect_timeout: 10,
			prepare: false,
		});
		dbInstance = drizzle(pgClient, { schema });
	}
	return dbInstance;
}

/**
 * Close the database connection
 * Should be called when shutting down the application
 */
export async function closeDb() {
	if (pgClient) {
		await pgClient.end();
		pgClient = null;
		dbInstance = null;
	}
}

// Export the database type for typing purposes
export type Database = ReturnType<typeof createClient>;

// Re-export commonly used Drizzle utilities
export {
	eq,
	ne,
	gt,
	gte,
	lt,
	lte,
	and,
	or,
	not,
	inArray,
	notInArray,
	isNull,
	isNotNull,
	like,
	ilike,
	sql,
	asc,
	desc,
	count,
	sum,
	avg,
	min,
	max,
} from 'drizzle-orm';
