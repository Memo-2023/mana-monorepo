import {
	uuid,
	text,
	integer,
	timestamp,
	index,
	pgEnum,
	decimal,
	unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cardsSchema } from './schema.js';
import { cards } from './cards.js';

// Progress status enum (SM-2 algorithm states)
export const progressStatusEnum = pgEnum('progress_status', [
	'new',
	'learning',
	'review',
	'relearning',
]);

export const cardProgress = cardsSchema.table(
	'card_progress',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		cardId: uuid('card_id')
			.notNull()
			.references(() => cards.id, { onDelete: 'cascade' }),
		// SM-2 algorithm fields
		easeFactor: decimal('ease_factor', { precision: 4, scale: 2 }).default('2.5').notNull(),
		interval: integer('interval').default(0).notNull(), // Days until next review
		repetitions: integer('repetitions').default(0).notNull(),
		lastReviewed: timestamp('last_reviewed', { withTimezone: true }),
		nextReview: timestamp('next_review', { withTimezone: true }),
		status: progressStatusEnum('status').default('new').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('idx_card_progress_user_id').on(table.userId),
		index('idx_card_progress_card_id').on(table.cardId),
		index('idx_card_progress_next_review').on(table.nextReview),
		index('idx_card_progress_status').on(table.status),
		unique('unique_user_card').on(table.userId, table.cardId),
	]
);

export const cardProgressRelations = relations(cardProgress, ({ one }) => ({
	card: one(cards, {
		fields: [cardProgress.cardId],
		references: [cards.id],
	}),
}));

export type CardProgress = typeof cardProgress.$inferSelect;
export type NewCardProgress = typeof cardProgress.$inferInsert;
