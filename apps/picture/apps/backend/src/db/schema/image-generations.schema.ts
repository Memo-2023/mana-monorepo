import { pgTable, uuid, text, timestamp, integer, real, pgEnum, index } from 'drizzle-orm/pg-core';
import { models } from './models.schema';
import { batchGenerations } from './batch-generations.schema';

export const generationStatusEnum = pgEnum('generation_status', [
	'pending',
	'queued',
	'processing',
	'completed',
	'failed',
	'cancelled',
]);

export const imageGenerations = pgTable(
	'image_generations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
		batchId: uuid('batch_id').references(() => batchGenerations.id, { onDelete: 'set null' }),

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
	},
	(table) => ({
		userIdIdx: index('image_generations_user_id_idx').on(table.userId),
		statusIdx: index('image_generations_status_idx').on(table.status),
		modelIdIdx: index('image_generations_model_id_idx').on(table.modelId),
		batchIdIdx: index('image_generations_batch_id_idx').on(table.batchId),
		replicatePredictionIdIdx: index('image_generations_replicate_prediction_id_idx').on(
			table.replicatePredictionId
		),
	})
);

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type NewImageGeneration = typeof imageGenerations.$inferInsert;
