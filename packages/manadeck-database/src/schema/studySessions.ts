import { pgTable, uuid, text, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks.js';

// Study mode enum
export const studyModeEnum = pgEnum('study_mode', ['all', 'new', 'review', 'favorites', 'random']);

export const studySessions = pgTable(
	'study_sessions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id')
			.notNull()
			.references(() => decks.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		mode: studyModeEnum('mode').notNull(),
		totalCards: integer('total_cards').notNull().default(0),
		completedCards: integer('completed_cards').notNull().default(0),
		correctCards: integer('correct_cards').notNull().default(0),
		startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
	},
	(table) => [
		index('idx_study_sessions_user_id').on(table.userId),
		index('idx_study_sessions_deck_id').on(table.deckId),
		index('idx_study_sessions_started_at').on(table.startedAt),
	]
);

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
	deck: one(decks, {
		fields: [studySessions.deckId],
		references: [decks.id],
	}),
}));

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
