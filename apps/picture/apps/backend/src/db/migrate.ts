import * as dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb, closeConnection } from './connection';

dotenv.config();

async function runMigrations() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not set');
	}

	const db = getDb(databaseUrl);

	console.log('Running migrations...');

	await migrate(db, { migrationsFolder: './src/db/migrations' });

	console.log('Migrations complete!');
	await closeConnection();
}

runMigrations().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
