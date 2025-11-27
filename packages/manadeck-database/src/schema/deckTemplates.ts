import {
	pgTable,
	uuid,
	varchar,
	text,
	boolean,
	integer,
	timestamp,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';

// Template data structure
export interface DeckTemplateData {
	cards: Array<{
		title?: string;
		content: Record<string, unknown>;
		cardType: 'text' | 'flashcard' | 'quiz' | 'mixed';
	}>;
	settings?: Record<string, unknown>;
	tags?: string[];
}

export const deckTemplates = pgTable(
	'deck_templates',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 255 }).notNull(),
		description: text('description'),
		category: varchar('category', { length: 100 }),
		templateData: jsonb('template_data').notNull().$type<DeckTemplateData>(),
		isActive: boolean('is_active').default(true).notNull(),
		isPublic: boolean('is_public').default(true).notNull(),
		popularity: integer('popularity').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_deck_templates_category').on(table.category),
		index('idx_deck_templates_is_active').on(table.isActive),
		index('idx_deck_templates_popularity').on(table.popularity),
	]
);

export type DeckTemplate = typeof deckTemplates.$inferSelect;
export type NewDeckTemplate = typeof deckTemplates.$inferInsert;
