import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to run SQL migrations against Supabase database
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts <migration-file-name>
 *
 * Example:
 *   npx tsx scripts/run-migration.ts create_story_votes_table.sql
 */

const SUPABASE_URL = process.env.MAERCHENZAUBER_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   MAERCHENZAUBER_SUPABASE_URL');
  console.error('   MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runMigration(migrationFileName: string) {
  const migrationPath = path.join(__dirname, '../migrations', migrationFileName);

  // Check if file exists
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  // Read migration file
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`📄 Running migration: ${migrationFileName}`);
  console.log(`📍 File path: ${migrationPath}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      console.log('⚠️  exec_sql function not available, trying direct query...');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`📊 Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

        const { error: stmtError } = await supabase.rpc('exec', {
          sql: statement,
        });

        if (stmtError) {
          console.error(`❌ Error executing statement ${i + 1}:`, stmtError);
          throw stmtError;
        }
      }

      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('✅ Migration completed successfully!');
      if (data) {
        console.log('📦 Result:', data);
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 You can run this migration manually in the Supabase SQL Editor:');
    console.error(`   1. Go to: ${SUPABASE_URL.replace('https://', 'https://app.')}/project/_/sql/new`);
    console.error(`   2. Copy and paste the contents of: ${migrationPath}`);
    console.error('   3. Click "Run"');
    process.exit(1);
  }
}

// Get migration file name from command line args
const migrationFileName = process.argv[2];

if (!migrationFileName) {
  console.error('❌ Please provide a migration file name');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx scripts/run-migration.ts <migration-file-name>');
  console.error('');
  console.error('Example:');
  console.error('  npx tsx scripts/run-migration.ts create_story_votes_table.sql');
  process.exit(1);
}

runMigration(migrationFileName);
