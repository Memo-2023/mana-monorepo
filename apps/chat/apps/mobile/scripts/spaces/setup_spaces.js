#!/usr/bin/env node

/**
 * This script sets up the spaces feature by running the necessary SQL scripts
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Get environment variables 
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file by semicolons to get individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Executing ${statements.length} statements from ${filename}...`);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement:`, error);
        console.error(`Statement was: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log(`✅ Successfully executed ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing ${filename}:`, error);
    return false;
  }
}

async function main() {
  console.log('Setting up spaces feature...');
  
  // Run the SQL scripts in the correct order
  const scripts = [
    'create_spaces_tables.sql',
    'create_spaces_triggers.sql',
    'create_spaces_rls.sql'
  ];
  
  for (const script of scripts) {
    const success = await executeSQL(script);
    if (!success) {
      console.error(`Failed to execute ${script}. Aborting.`);
      process.exit(1);
    }
  }
  
  console.log('✅ Spaces feature setup complete!');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});