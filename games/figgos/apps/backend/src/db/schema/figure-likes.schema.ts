import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { figures } from './figures.schema';

export const figureLikes = pgTable(
	'figure_likes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		figureId: uuid('figure_id')
			.notNull()
			.references(() => figures.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => ({
		uniqueLike: unique().on(table.figureId, table.userId),
	})
);

export const figureLikesRelations = relations(figureLikes, ({ one }) => ({
	figure: one(figures, {
		fields: [figureLikes.figureId],
		references: [figures.id],
	}),
}));

export type FigureLike = typeof figureLikes.$inferSelect;
export type NewFigureLike = typeof figureLikes.$inferInsert;
