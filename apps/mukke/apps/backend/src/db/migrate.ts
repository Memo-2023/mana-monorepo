import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	console.log('Running migrations...');
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('Migrations complete!');

	await connection.end();
	process.exit(0);
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
