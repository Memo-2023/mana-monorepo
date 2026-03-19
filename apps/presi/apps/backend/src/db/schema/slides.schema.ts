import { pgTable, uuid, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.schema';

export const slides = pgTable(
	'slides',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id')
			.notNull()
			.references(() => decks.id, { onDelete: 'cascade' }),
		order: integer('order').notNull(),
		content: jsonb('content').$type<{
			type: 'title' | 'content' | 'image' | 'split';
			title?: string;
			subtitle?: string;
			body?: string;
			imageUrl?: string;
			bulletPoints?: string[];
		}>(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('slides_deck_id_idx').on(table.deckId),
		index('slides_deck_order_idx').on(table.deckId, table.order),
	]
);

export const slidesRelations = relations(slides, ({ one }) => ({
	deck: one(decks, {
		fields: [slides.deckId],
		references: [decks.id],
	}),
}));
