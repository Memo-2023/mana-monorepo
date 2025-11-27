import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	console.log('Running migrations...');

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	await migrate(db, { migrationsFolder: './src/db/migrations' });

	await connection.end();

	console.log('Migrations completed!');
}

runMigrations().catch(console.error);
