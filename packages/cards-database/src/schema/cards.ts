import {
	pgTable,
	uuid,
	varchar,
	text,
	integer,
	boolean,
	timestamp,
	jsonb,
	index,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.js';
import { cardProgress } from './cardProgress.js';

// Card type enum
export const cardTypeEnum = pgEnum('card_type', ['text', 'flashcard', 'quiz', 'mixed']);

// Card content types
export interface TextContent {
	text: string;
	formatting?: {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
	};
}

export interface FlashcardContent {
	front: string;
	back: string;
	hint?: string;
}

export interface QuizContent {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

export interface MixedContent {
	sections: Array<TextContent | FlashcardContent | QuizContent>;
}

export type CardContent = TextContent | FlashcardContent | QuizContent | MixedContent;

export const cards = pgTable(
	'cards',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id')
			.notNull()
			.references(() => decks.id, { onDelete: 'cascade' }),
		position: integer('position').notNull().default(0),
		title: varchar('title', { length: 255 }),
		content: jsonb('content').notNull().$type<CardContent>(),
		cardType: cardTypeEnum('card_type').notNull(),
		aiModel: varchar('ai_model', { length: 100 }),
		aiPrompt: text('ai_prompt'),
		version: integer('version').default(1).notNull(),
		isFavorite: boolean('is_favorite').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_cards_deck_id').on(table.deckId),
		index('idx_cards_position').on(table.deckId, table.position),
	]
);

export const cardsRelations = relations(cards, ({ one, many }) => ({
	deck: one(decks, {
		fields: [cards.deckId],
		references: [decks.id],
	}),
	progress: many(cardProgress),
}));

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
