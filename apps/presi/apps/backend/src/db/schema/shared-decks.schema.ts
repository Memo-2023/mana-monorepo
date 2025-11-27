import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.schema';

export const sharedDecks = pgTable('shared_decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  shareCode: text('share_code').notNull().unique(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sharedDecksRelations = relations(sharedDecks, ({ one }) => ({
  deck: one(decks, {
    fields: [sharedDecks.deckId],
    references: [decks.id],
  }),
}));
