/**
 * Drizzle migration runner.
 *
 * Run on every container startup (and as `pnpm db:migrate` for local use)
 * so that fresh deployments end up with the `media` schema and tables
 * without any manual SQL. Drizzle's migrator tracks applied migrations
 * in `drizzle.__drizzle_migrations`, so re-runs are no-ops.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export async function runMigrations(databaseUrl: string): Promise<void> {
	// Migrations live next to this file at runtime, regardless of cwd.
	const here = dirname(fileURLToPath(import.meta.url));
	const migrationsFolder = resolve(here, 'migrations');

	// `max: 1` is required by drizzle's migrator.
	const sql = postgres(databaseUrl, { max: 1 });
	try {
		const db = drizzle(sql);
		await migrate(db, { migrationsFolder });
	} finally {
		await sql.end({ timeout: 5 });
	}
}

// Allow `bun run src/db/migrate.ts` for manual / CI use.
if (import.meta.main) {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('DATABASE_URL is required');
		process.exit(1);
	}
	runMigrations(databaseUrl)
		.then(() => {
			console.log('Migrations applied');
			process.exit(0);
		})
		.catch((err) => {
			console.error('Migration failed:', err);
			process.exit(1);
		});
}
