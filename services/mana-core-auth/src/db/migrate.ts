import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb, closeConnection } from './connection';

// Load environment variables
config();

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Running migrations...');

  try {
    const db = getDb(databaseUrl);
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

runMigrations();
