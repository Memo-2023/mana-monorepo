import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { slides } from './slides.schema';
import { themes } from './themes.schema';
import { sharedDecks } from './shared-decks.schema';

export const decks = pgTable('decks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(), // TEXT for Better Auth nanoid user IDs
	title: text('title').notNull(),
	description: text('description'),
	themeId: uuid('theme_id').references(() => themes.id),
	isPublic: boolean('is_public').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const decksRelations = relations(decks, ({ many, one }) => ({
	slides: many(slides),
	theme: one(themes, {
		fields: [decks.themeId],
		references: [themes.id],
	}),
	sharedDecks: many(sharedDecks),
}));
