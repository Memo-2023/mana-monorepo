import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { collections } from './collections.schema';

export const questions = pgTable('questions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	collectionId: uuid('collection_id').references(() => collections.id, {
		onDelete: 'set null',
	}),

	// Content
	title: text('title').notNull(),
	description: text('description'),

	// Status & Priority
	status: text('status').notNull().default('open'), // 'open', 'researching', 'answered', 'archived'
	priority: text('priority').default('normal'), // 'low', 'normal', 'high', 'urgent'

	// Categorization
	tags: text('tags').array().default([]),
	category: text('category'),

	// Research config
	researchDepth: text('research_depth').default('quick'), // 'quick', 'standard', 'deep'
	autoResearch: boolean('auto_research').default(false),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	answeredAt: timestamp('answered_at', { withTimezone: true }),

	// Soft delete
	isArchived: boolean('is_archived').default(false),
	archivedAt: timestamp('archived_at', { withTimezone: true }),
	deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
