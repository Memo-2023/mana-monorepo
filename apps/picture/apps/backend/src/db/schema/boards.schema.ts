import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';

export const boards = pgTable(
	'boards',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),

		name: text('name').notNull(),
		description: text('description'),
		thumbnailUrl: text('thumbnail_url'),

		canvasWidth: integer('canvas_width').default(2000).notNull(),
		canvasHeight: integer('canvas_height').default(1500).notNull(),
		backgroundColor: text('background_color').default('#ffffff').notNull(),

		isPublic: boolean('is_public').default(false).notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('boards_user_id_idx').on(table.userId),
	})
);

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
