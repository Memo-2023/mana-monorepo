import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.schema';

export const sharedDecks = pgTable(
	'shared_decks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id')
			.notNull()
			.references(() => decks.id, { onDelete: 'cascade' }),
		shareCode: text('share_code').notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('shared_decks_deck_id_idx').on(table.deckId)]
);

export const sharedDecksRelations = relations(sharedDecks, ({ one }) => ({
	deck: one(decks, {
		fields: [sharedDecks.deckId],
		references: [decks.id],
	}),
}));
