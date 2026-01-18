import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as dotenv from 'dotenv';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

dotenv.config();

async function runMigrations() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	console.log('Running migrations...');

	const sql = postgres(databaseUrl, { max: 1 });
	const db = drizzle(sql);

	await migrate(db, { migrationsFolder: './src/db/migrations' });

	await sql.end();

	console.log('Migrations completed successfully!');
}

runMigrations().catch(console.error);
