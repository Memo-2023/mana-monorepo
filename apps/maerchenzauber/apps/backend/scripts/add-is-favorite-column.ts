#!/usr/bin/env tsx

/**
 * Migration script to add is_favorite column to stories table
 * Run with: npx tsx scripts/add-is-favorite-column.ts
 */

import { createClient } from '@supabase/supabase-js';

async function runMigration() {
  console.log('🔄 Starting migration: Add is_favorite column to stories table');

  // Get credentials from environment
  const supabaseUrl = process.env.MAERCHENZAUBER_SUPABASE_URL;
  const supabaseServiceKey = process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please set MAERCHENZAUBER_SUPABASE_URL and MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('📍 Supabase URL:', supabaseUrl);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if column already exists
    console.log('🔍 Checking if is_favorite column exists...');

    const { data: existingColumn, error: checkError } = await supabase
      .rpc('check_column_exists', {
        table_name: 'stories',
        column_name: 'is_favorite'
      });

    // If the RPC doesn't exist, we'll just try to add the column
    // Supabase will handle the "IF NOT EXISTS" part

    console.log('➕ Adding is_favorite column...');

    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add is_favorite column to stories table
        ALTER TABLE stories
        ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

        -- Create index for faster filtering
        CREATE INDEX IF NOT EXISTS idx_stories_is_favorite
        ON stories(user_id, is_favorite)
        WHERE is_favorite = true;
      `
    });

    if (error) {
      // Try direct SQL approach
      console.log('⚠️  RPC approach failed, trying direct SQL...');

      const { error: directError } = await supabase
        .from('stories')
        .select('is_favorite')
        .limit(1);

      if (directError && directError.message.includes('column "is_favorite" does not exist')) {
        console.log('❌ Column does not exist and cannot be added via Supabase client');
        console.log('');
        console.log('📝 Please run this SQL manually in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;');
        console.log('CREATE INDEX IF NOT EXISTS idx_stories_is_favorite ON stories(user_id, is_favorite) WHERE is_favorite = true;');
        console.log('');
        process.exit(1);
      } else if (!directError) {
        console.log('✅ Column already exists!');
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }

    // Test the column
    console.log('🧪 Testing is_favorite column...');
    const { data: testData, error: testError } = await supabase
      .from('stories')
      .select('id, is_favorite')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing column:', testError.message);
      throw testError;
    }

    console.log('✅ Column is working correctly!');
    console.log('📊 Sample data:', testData);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('');
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
