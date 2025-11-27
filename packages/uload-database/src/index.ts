// Database client exports
export { createClient, getDb, closeDb, type Database } from './client.js';

// Re-export Drizzle utilities
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
} from './client.js';

// Schema exports
export * from './schema/index.js';
