import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	boolean,
	integer,
	index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';

export const kanbanBoards = pgTable(
	'kanban_boards',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),

		// Board properties
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#8b5cf6'),
		icon: varchar('icon', { length: 50 }),
		order: integer('order').default(0).notNull(),

		// Special flags
		isGlobal: boolean('is_global').default(false),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('kanban_boards_user_idx').on(table.userId),
		projectIdx: index('kanban_boards_project_idx').on(table.projectId),
		orderIdx: index('kanban_boards_order_idx').on(table.userId, table.order),
		globalIdx: index('kanban_boards_global_idx').on(table.userId, table.isGlobal),
	})
);

export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type NewKanbanBoard = typeof kanbanBoards.$inferInsert;
