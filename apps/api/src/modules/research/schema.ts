/**
 * Research module — DB schema (Drizzle / pgSchema 'research')
 *
 * Server-side store for deep-research runs orchestrated by apps/api.
 * Lives in mana_platform under its own pgSchema.
 *
 * - research_results: one row per research run, holds plan + final synthesis
 * - sources:          one row per web source consumed by a run
 *
 * The local-first questions module references research_results.id from
 * LocalAnswer.researchResultId; sources are fetched on-demand via the API
 * and never mirrored into IndexedDB (they're public web content).
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgSchema, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://mana:devpassword@localhost:5432/mana_platform';

export const researchSchema = pgSchema('research');

/**
 * One row per research run. Created in `planning` state immediately on
 * /start, then updated as the orchestrator advances through phases.
 */
export const researchResults = researchSchema.table('research_results', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id').notNull(),
	questionId: text('question_id').notNull(), // mirrors local LocalQuestion.id (UUID)
	depth: text('depth').notNull(), // 'quick' | 'standard' | 'deep'
	status: text('status').notNull(), // 'planning' | 'searching' | 'extracting' | 'synthesizing' | 'done' | 'error'
	subQueries: jsonb('sub_queries').$type<string[]>(),
	summary: text('summary'),
	keyPoints: jsonb('key_points').$type<string[]>(),
	followUpQuestions: jsonb('follow_up_questions').$type<string[]>(),
	errorMessage: text('error_message'),
	startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
	finishedAt: timestamp('finished_at', { withTimezone: true }),
});

/**
 * Sources consumed during a research run. Rank reflects ordering in the
 * synthesis prompt so citation [n] in the summary maps to sources[n-1].
 */
export const sources = researchSchema.table('sources', {
	id: uuid('id').defaultRandom().primaryKey(),
	researchResultId: uuid('research_result_id')
		.notNull()
		.references(() => researchResults.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	title: text('title'),
	snippet: text('snippet'),
	extractedContent: text('extracted_content'),
	category: text('category'),
	rank: integer('rank').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

const connection = postgres(DATABASE_URL, { max: 5, idle_timeout: 20 });
export const db = drizzle(connection, { schema: { researchResults, sources } });

export type ResearchResult = typeof researchResults.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type ResearchDepth = 'quick' | 'standard' | 'deep';
export type ResearchStatus =
	| 'planning'
	| 'searching'
	| 'extracting'
	| 'synthesizing'
	| 'done'
	| 'error';
