import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createClient } from './client.js';
import path from 'path';

async function runMigrations() {
  console.log('Running migrations...');

  const db = createClient();

  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../drizzle'),
    });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigrations();
