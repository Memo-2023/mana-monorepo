import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get connection string from environment
const connectionString =
	process.env.DATABASE_URL || 'postgresql://uload:uload_dev_password_123@localhost:5432/uload_dev';

// Connection pool for queries
export const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

// Drizzle instance with schema
export const db = drizzle(client, { schema });

// Types for convenience
export type DB = typeof db;
export type TX = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Export all schema tables and relations for easy access
export * from './schema';
