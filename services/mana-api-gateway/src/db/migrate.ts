import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
	const databaseUrl =
		process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/manacore';

	console.log('Connecting to database...');
	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	console.log('Running migrations...');
	await migrate(db, { migrationsFolder: './src/db/migrations' });

	console.log('Migrations complete!');
	await connection.end();
	process.exit(0);
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
