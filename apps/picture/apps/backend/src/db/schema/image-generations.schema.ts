import { pgTable, uuid, text, timestamp, integer, real, pgEnum } from 'drizzle-orm/pg-core';

export const generationStatusEnum = pgEnum('generation_status', [
	'pending',
	'queued',
	'processing',
	'completed',
	'failed',
	'cancelled',
]);

export const imageGenerations = pgTable('image_generations', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	modelId: uuid('model_id'),
	batchId: uuid('batch_id'),

	prompt: text('prompt').notNull(),
	negativePrompt: text('negative_prompt'),
	model: text('model'),
	style: text('style'),
	sourceImageUrl: text('source_image_url'),

	width: integer('width'),
	height: integer('height'),
	steps: integer('steps'),
	guidanceScale: real('guidance_scale'),
	seed: integer('seed'),
	generationStrength: real('generation_strength'),

	status: generationStatusEnum('status').default('pending').notNull(),
	replicatePredictionId: text('replicate_prediction_id'),
	errorMessage: text('error_message'),
	generationTimeSeconds: integer('generation_time_seconds'),
	retryCount: integer('retry_count').default(0).notNull(),
	priority: integer('priority').default(0).notNull(),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
});

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type NewImageGeneration = typeof imageGenerations.$inferInsert;
