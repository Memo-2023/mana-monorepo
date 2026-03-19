import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection, { schema });

	console.log('Seeding database...');

	// Add seed data here if needed
	// Example:
	// await db.insert(schema.projects).values({
	//   userId: 'test-user',
	//   title: 'Demo Project',
	//   description: 'A demo project for testing',
	// });

	console.log('Seeding complete!');

	await connection.end();
	process.exit(0);
}

main().catch((err) => {
	console.error('Seeding failed:', err);
	process.exit(1);
});
