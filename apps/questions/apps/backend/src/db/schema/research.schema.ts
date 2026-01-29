import { pgTable, uuid, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { questions } from './questions.schema';

export const researchResults = pgTable('research_results', {
	id: uuid('id').primaryKey().defaultRandom(),
	questionId: uuid('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),

	// Research metadata
	modelId: text('model_id').notNull(),
	provider: text('provider').notNull(), // 'searxng', 'ollama', 'openrouter'
	researchDepth: text('research_depth').notNull(), // 'quick', 'standard', 'deep'

	// Results
	summary: text('summary').notNull(),
	keyPoints: jsonb('key_points').default([]),
	followUpQuestions: text('follow_up_questions').array().default([]),

	// Token tracking
	promptTokens: integer('prompt_tokens'),
	completionTokens: integer('completion_tokens'),
	estimatedCost: real('estimated_cost'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	durationMs: integer('duration_ms'),
});

export type ResearchResult = typeof researchResults.$inferSelect;
export type NewResearchResult = typeof researchResults.$inferInsert;
