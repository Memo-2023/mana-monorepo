import { uuid, text, varchar, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cardsSchema } from './schema.js';
import { cards } from './cards.js';
import { studySessions } from './studySessions.js';
import { aiGenerations } from './aiGenerations.js';

export const decks = cardsSchema.table(
	'decks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),
		coverImageUrl: text('cover_image_url'),
		isPublic: boolean('is_public').default(false).notNull(),
		isFeatured: boolean('is_featured').default(false).notNull(),
		featuredAt: timestamp('featured_at', { withTimezone: true }),
		settings: jsonb('settings').default({}).$type<Record<string, unknown>>(),
		tags: text('tags').array().default([]),
		metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_decks_user_id').on(table.userId),
		index('idx_decks_is_public').on(table.isPublic),
		index('idx_decks_is_featured').on(table.isFeatured),
		index('idx_decks_updated_at').on(table.updatedAt),
	]
);

export const decksRelations = relations(decks, ({ many }) => ({
	cards: many(cards),
	studySessions: many(studySessions),
	aiGenerations: many(aiGenerations),
}));

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
