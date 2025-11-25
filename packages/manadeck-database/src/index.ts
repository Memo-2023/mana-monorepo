// Main entry point for @manacore/manadeck-database

// Export database client utilities
export { createClient, getDb, closeDb, type Database } from './client';

// Export Drizzle utilities
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  like,
  ilike,
  sql,
  asc,
  desc,
  count,
  sum,
  avg,
  min,
  max,
} from './client';

// Export all schemas and types
export * from './schema';
