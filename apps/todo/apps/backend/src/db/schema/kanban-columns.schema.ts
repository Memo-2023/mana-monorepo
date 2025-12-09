import { pgTable, uuid, timestamp, varchar, boolean, integer, index } from 'drizzle-orm/pg-core';
import { kanbanBoards } from './kanban-boards.schema';

// Define locally to avoid circular dependency with tasks.schema
export type KanbanTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export const kanbanColumns = pgTable(
	'kanban_columns',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),
		boardId: uuid('board_id')
			.references(() => kanbanBoards.id, { onDelete: 'cascade' })
			.notNull(),

		// Column properties
		name: varchar('name', { length: 100 }).notNull(),
		color: varchar('color', { length: 7 }).default('#6B7280'),
		order: integer('order').default(0).notNull(),

		// Behavior
		isDefault: boolean('is_default').default(false),
		defaultStatus: varchar('default_status', { length: 20 }).$type<KanbanTaskStatus>(),
		autoComplete: boolean('auto_complete').default(false),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('kanban_columns_user_idx').on(table.userId),
		boardIdx: index('kanban_columns_board_idx').on(table.boardId),
		orderIdx: index('kanban_columns_order_idx').on(table.boardId, table.order),
	})
);

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type NewKanbanColumn = typeof kanbanColumns.$inferInsert;
