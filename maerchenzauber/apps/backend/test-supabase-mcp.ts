import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables - try multiple locations
const envPath = process.env.ENV_PATH || path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.log('Note: .env file not found, will use environment variables');
}

const supabaseUrl = process.env.MAERCHENZAUBER_SUPABASE_URL;
const supabaseKey = process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY || process.env.MAERCHENZAUBER_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('MAERCHENZAUBER_SUPABASE_URL:', !!supabaseUrl);
  console.error('MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY:', !!process.env.MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY);
  console.error('MAERCHENZAUBER_SUPABASE_ANON_KEY:', !!process.env.MAERCHENZAUBER_SUPABASE_ANON_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('='.repeat(80));
  console.log('SUPABASE MCP SERVER CONNECTION TEST');
  console.log('='.repeat(80));
  console.log('Project ID: dyywxrmonxoiojsjmymc');
  console.log('Mode: Read-only testing\n');

  try {
    // Test 1: List all tables
    console.log('TEST 1: Listing all tables in the database');
    console.log('-'.repeat(80));

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      // Alternative method using RPC or direct query
      console.log('Note: information_schema query not available, using alternative method...');

      // Try to infer tables from known schema
      const knownTables = ['characters', 'stories', 'story_collections', 'user_settings'];
      console.log('\nKnown tables from schema:');
      for (const table of knownTables) {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
          console.log(`  ✓ ${table}`);
        }
      }
    } else {
      console.log('\nTables found:');
      tables?.forEach((table: any) => {
        console.log(`  - ${table.table_name}`);
      });
    }

    // Test 2: Get schema of 'stories' table
    console.log('\n\nTEST 2: Getting schema/structure of the "stories" table');
    console.log('-'.repeat(80));

    const { data: storiesSchema, error: schemaError } = await supabase
      .from('stories')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('Error fetching stories schema:', schemaError.message);
    } else {
      // Get column information by fetching one row
      const { data: sampleRow } = await supabase
        .from('stories')
        .select('*')
        .limit(1)
        .single();

      console.log('\nStories table columns:');
      if (sampleRow) {
        Object.keys(sampleRow).forEach(column => {
          const value = sampleRow[column];
          const type = typeof value === 'object' && value !== null ? 'json/object' : typeof value;
          console.log(`  - ${column}: ${type}`);
        });
      } else {
        console.log('  (No data available to infer schema - table may be empty)');
        console.log('  Expected columns: id, user_id, title, description, pages, language, etc.');
      }
    }

    // Test 3: Count records in 'characters' table
    console.log('\n\nTEST 3: Counting records in the "characters" table');
    console.log('-'.repeat(80));

    const { count: charactersCount, error: countError } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting characters:', countError.message);
    } else {
      console.log(`\nTotal characters in database: ${charactersCount}`);
    }

    // Test 4: Get sample records from 'stories' table
    console.log('\n\nTEST 4: Fetching sample of 3 records from the "stories" table');
    console.log('-'.repeat(80));

    const { data: storiesSample, error: sampleError } = await supabase
      .from('stories')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('Error fetching stories sample:', sampleError.message);
    } else {
      if (storiesSample && storiesSample.length > 0) {
        console.log(`\nFound ${storiesSample.length} sample record(s):\n`);
        storiesSample.forEach((story: any, index: number) => {
          console.log(`Record ${index + 1}:`);
          console.log(`  ID: ${story.id}`);
          console.log(`  Title: ${story.title}`);
          console.log(`  User ID: ${story.user_id}`);
          console.log(`  Language: ${story.language}`);
          console.log(`  Pages: ${story.pages?.length || 0} pages`);
          console.log(`  Created: ${story.created_at}`);
          console.log(`  Is Favorite: ${story.is_favorite}`);
          console.log(`  Is Public: ${story.is_public}`);
          console.log('');
        });
      } else {
        console.log('\nNo stories found in the database.');
      }
    }

    // Additional test: Check characters sample
    console.log('\nBONUS: Sample of 3 records from the "characters" table');
    console.log('-'.repeat(80));

    const { data: charactersSample, error: charSampleError } = await supabase
      .from('characters')
      .select('*')
      .limit(3);

    if (charSampleError) {
      console.error('Error fetching characters sample:', charSampleError.message);
    } else {
      if (charactersSample && charactersSample.length > 0) {
        console.log(`\nFound ${charactersSample.length} sample character(s):\n`);
        charactersSample.forEach((char: any, index: number) => {
          console.log(`Character ${index + 1}:`);
          console.log(`  ID: ${char.id}`);
          console.log(`  Name: ${char.name}`);
          console.log(`  Description: ${char.description?.substring(0, 80)}...`);
          console.log(`  User ID: ${char.user_id}`);
          console.log(`  Created: ${char.created_at}`);
          console.log('');
        });
      } else {
        console.log('\nNo characters found in the database.');
      }
    }

    console.log('='.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\nFATAL ERROR during testing:');
    console.error(error);
    process.exit(1);
  }
}

testSupabaseConnection();
