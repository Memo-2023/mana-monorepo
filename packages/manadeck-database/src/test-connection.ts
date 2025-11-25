/**
 * Test database connection
 * Usage: pnpm db:test
 */

import { getDb, closeDb, sql } from './client';

async function testConnection() {
  console.log('Testing database connection...\n');

  try {
    const db = getDb();

    // Test basic connection
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`);
    console.log('✅ Connection successful!');
    console.log(`   Time: ${result[0].current_time}`);
    console.log(`   PostgreSQL: ${result[0].pg_version}\n`);

    // List tables
    const tables = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tables.length > 0) {
      console.log('📋 Tables in database:');
      tables.forEach((t: any) => console.log(`   - ${t.tablename}`));
    } else {
      console.log('📋 No tables found. Run "pnpm db:push" to create schema.');
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

testConnection();
