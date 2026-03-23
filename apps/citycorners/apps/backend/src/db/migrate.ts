import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const postgres = require('postgres');

const databaseUrl =
	process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/citycorners';

async function runMigrations() {
	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	console.log('Running migrations...');
	await migrate(db, { migrationsFolder: './src/db/migrations' });
	console.log('Migrations completed.');

	await connection.end();
}

runMigrations().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
