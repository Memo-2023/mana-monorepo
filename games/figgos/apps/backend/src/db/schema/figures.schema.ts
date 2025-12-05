import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const figures = pgTable('figures', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	subject: text('subject').notNull(),
	imageUrl: text('image_url').notNull(),
	enhancedPrompt: text('enhanced_prompt'),
	rarity: text('rarity').default('common'),
	characterInfo: jsonb('character_info'),
	isPublic: boolean('is_public').default(true),
	isArchived: boolean('is_archived').default(false),
	likes: integer('likes').default(0),
	userId: uuid('user_id').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

export const figuresRelations = relations(figures, ({ many }) => ({
	likes: many(figureLikes),
}));

import { figureLikes } from './figure-likes.schema';

export type Figure = typeof figures.$inferSelect;
export type NewFigure = typeof figures.$inferInsert;
