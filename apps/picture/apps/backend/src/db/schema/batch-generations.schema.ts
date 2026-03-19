import { pgTable, uuid, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { models } from './models.schema';

export const batchStatusEnum = pgEnum('batch_status', [
	'pending',
	'processing',
	'completed',
	'partial',
	'failed',
]);

export const batchGenerations = pgTable(
	'batch_generations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: text('name'),

		totalCount: integer('total_count').notNull(),
		completedCount: integer('completed_count').default(0).notNull(),
		failedCount: integer('failed_count').default(0).notNull(),
		processingCount: integer('processing_count').default(0).notNull(),
		pendingCount: integer('pending_count').default(0).notNull(),

		status: batchStatusEnum('status').default('pending').notNull(),

		// Shared settings for all generations in the batch
		modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
		modelVersion: text('model_version'),
		width: integer('width'),
		height: integer('height'),
		steps: integer('steps'),
		guidanceScale: integer('guidance_scale'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
	},
	(table) => ({
		userIdIdx: index('batch_generations_user_id_idx').on(table.userId),
		statusIdx: index('batch_generations_status_idx').on(table.status),
		modelIdIdx: index('batch_generations_model_id_idx').on(table.modelId),
	})
);

export type BatchGeneration = typeof batchGenerations.$inferSelect;
export type NewBatchGeneration = typeof batchGenerations.$inferInsert;
