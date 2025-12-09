/**
 * Database Migration Script with Advisory Locks
 *
 * This script safely runs database migrations with the following features:
 * - Advisory locks to prevent concurrent migrations
 * - Retry logic for transient network failures
 * - Timeout protection
 * - Proper cleanup on exit
 * - Graceful handling when no migrations exist
 *
 * Usage:
 *   pnpm db:migrate                    # Run migrations
 *   MIGRATION_TIMEOUT=600 pnpm db:migrate  # With custom timeout (seconds)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Configuration
const MIGRATION_LOCK_ID = 987654321; // Unique lock ID for mana-core-auth migrations
const MAX_LOCK_WAIT_MS = parseInt(process.env.MIGRATION_TIMEOUT || '300', 10) * 1000; // Default 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Retry wrapper for transient errors
 */
async function withRetry<T>(
	operation: () => Promise<T>,
	operationName: string,
	maxRetries = MAX_RETRIES
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			// Check if error is transient (network-related)
			const isTransient =
				lastError.message?.includes('ECONNREFUSED') ||
				lastError.message?.includes('ETIMEDOUT') ||
				lastError.message?.includes('ENOTFOUND') ||
				lastError.message?.includes('connection') ||
				(lastError as any).code === '57P03'; // PostgreSQL: cannot connect now

			if (!isTransient || attempt === maxRetries) {
				throw error;
			}

			const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
			console.log(
				`\u26a0\ufe0f  [${operationName}] Transient error, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`
			);
			console.log(`   Error: ${lastError.message}`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError!;
}

/**
 * Acquire PostgreSQL advisory lock
 */
async function acquireLock(db: ReturnType<typeof drizzle>): Promise<boolean> {
	const result = await db.execute(
		sql`SELECT pg_try_advisory_lock(${MIGRATION_LOCK_ID}) as acquired`
	);
	return (result as any)[0]?.acquired === true;
}

/**
 * Release PostgreSQL advisory lock
 */
async function releaseLock(db: ReturnType<typeof drizzle>): Promise<void> {
	await db.execute(sql`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`);
}

/**
 * Wait for migration lock with timeout
 */
async function waitForLock(db: ReturnType<typeof drizzle>): Promise<boolean> {
	const startTime = Date.now();

	while (Date.now() - startTime < MAX_LOCK_WAIT_MS) {
		const acquired = await acquireLock(db);
		if (acquired) {
			return true;
		}

		const elapsed = Math.round((Date.now() - startTime) / 1000);
		console.log(`\u23f3 Waiting for migration lock... (${elapsed}s / ${MAX_LOCK_WAIT_MS / 1000}s)`);
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}

	return false;
}

/**
 * Main migration function
 */
async function runMigrations(): Promise<void> {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	console.log('\n\ud83d\udd04 Starting database migration process...');
	console.log(`   Lock ID: ${MIGRATION_LOCK_ID}`);
	console.log(`   Timeout: ${MAX_LOCK_WAIT_MS / 1000}s`);
	console.log('');

	// Create connection with single connection for migrations
	const connection = postgres(databaseUrl, {
		max: 1,
		idle_timeout: 20,
		connect_timeout: 30,
	});

	const db = drizzle(connection);
	let lockAcquired = false;

	try {
		// Test database connection
		console.log('\ud83d\udd0c Testing database connection...');
		await withRetry(async () => {
			await db.execute(sql`SELECT 1`);
		}, 'Database connection');
		console.log('\u2705 Database connection successful\n');

		// Attempt to acquire advisory lock
		console.log('\ud83d\udd12 Attempting to acquire migration lock...');

		lockAcquired = await withRetry(() => acquireLock(db), 'Acquire lock');

		if (!lockAcquired) {
			console.log('\u23f3 Another instance is running migrations. Waiting for lock...');

			lockAcquired = await waitForLock(db);

			if (!lockAcquired) {
				throw new Error(
					`Migration lock timeout after ${MAX_LOCK_WAIT_MS / 1000}s - another migration may be stuck`
				);
			}
		}

		console.log('\u2705 Migration lock acquired\n');

		// Check if migration files exist
		const migrationsFolder = './src/db/migrations';
		const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');

		if (!fs.existsSync(journalPath)) {
			console.log('\u26a0\ufe0f  No migration files found (meta/_journal.json missing)');
			console.log('   This is normal if you have not generated any migrations yet.');
			console.log('   To generate migrations, run: pnpm db:generate');
			console.log('   For development, you can use: pnpm db:push');
			console.log('\n\u2705 No migrations to run\n');
			return;
		}

		// Run migrations
		console.log('\ud83d\udce6 Running database migrations...');

		await withRetry(
			async () => {
				await migrate(db, {
					migrationsFolder,
				});
			},
			'Run migrations',
			1 // Only 1 attempt for actual migrations (they should be idempotent)
		);

		console.log('\u2705 Migrations completed successfully\n');
	} catch (error) {
		console.error('\n\u274c Migration failed:', error);
		throw error;
	} finally {
		// Always attempt to release lock
		if (lockAcquired) {
			try {
				await releaseLock(db);
				console.log('\ud83d\udd13 Migration lock released');
			} catch (unlockError) {
				console.error('\u26a0\ufe0f  Failed to release lock:', unlockError);
			}
		}

		// Close connection
		try {
			await connection.end();
			console.log('\ud83d\udd0c Database connection closed\n');
		} catch (closeError) {
			console.error('\u26a0\ufe0f  Failed to close connection:', closeError);
		}
	}
}

// Run migrations
runMigrations()
	.then(() => {
		console.log('\ud83c\udf89 Migration process completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n\ud83d\udca5 Migration process failed:', error.message);
		process.exit(1);
	});
