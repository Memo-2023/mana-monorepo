import { pgTable, uuid, text, integer, real, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { questions } from './questions.schema';
import { researchResults } from './research.schema';

export const answers = pgTable('answers', {
	id: uuid('id').primaryKey().defaultRandom(),
	questionId: uuid('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),
	researchResultId: uuid('research_result_id').references(() => researchResults.id, {
		onDelete: 'set null',
	}),

	// Answer content
	content: text('content').notNull(),
	contentMarkdown: text('content_markdown'),
	summary: text('summary'), // Short summary of the answer

	// Generation metadata
	modelId: text('model_id').notNull(),
	provider: text('provider').notNull(), // 'ollama', 'openrouter'

	// Token tracking
	promptTokens: integer('prompt_tokens'),
	completionTokens: integer('completion_tokens'),
	estimatedCost: real('estimated_cost'),

	// Quality indicators
	confidence: real('confidence'), // 0-1 confidence score
	sourceCount: integer('source_count'), // Number of sources used
	citations: jsonb('citations').default([]), // Array of citation references

	// User feedback
	rating: integer('rating'), // 1-5 user rating
	feedback: text('feedback'), // User feedback text
	isAccepted: boolean('is_accepted').default(false), // User marked as accepted answer

	// Versioning
	version: integer('version').default(1),
	previousVersionId: uuid('previous_version_id'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	durationMs: integer('duration_ms'),
});

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
