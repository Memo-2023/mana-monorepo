import { pgTable, uuid, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.schema';

export const themes = pgTable('themes', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	colors: jsonb('colors').$type<{
		primary: string;
		secondary: string;
		background: string;
		text: string;
		accent: string;
	}>(),
	fonts: jsonb('fonts').$type<{
		heading: string;
		body: string;
	}>(),
	isDefault: boolean('is_default').default(false).notNull(),
});

export const themesRelations = relations(themes, ({ many }) => ({
	decks: many(decks),
}));
