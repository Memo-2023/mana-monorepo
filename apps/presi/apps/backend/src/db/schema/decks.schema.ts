import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { slides } from './slides.schema';
import { themes } from './themes.schema';
import { sharedDecks } from './shared-decks.schema';

export const decks = pgTable(
	'decks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(), // TEXT for Better Auth nanoid user IDs
		title: text('title').notNull(),
		description: text('description'),
		themeId: uuid('theme_id').references(() => themes.id),
		isPublic: boolean('is_public').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('decks_user_id_idx').on(table.userId),
		index('decks_user_updated_idx').on(table.userId, table.updatedAt),
		index('decks_theme_id_idx').on(table.themeId),
	]
);

export const decksRelations = relations(decks, ({ many, one }) => ({
	slides: many(slides),
	theme: one(themes, {
		fields: [decks.themeId],
		references: [themes.id],
	}),
	sharedDecks: many(sharedDecks),
}));
