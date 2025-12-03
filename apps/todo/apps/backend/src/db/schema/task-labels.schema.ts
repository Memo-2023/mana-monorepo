import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core';
import { tasks } from './tasks.schema';
import { labels } from './labels.schema';

export const taskLabels = pgTable(
	'task_labels',
	{
		taskId: uuid('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		labelId: uuid('label_id')
			.notNull()
			.references(() => labels.id, { onDelete: 'cascade' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.taskId, table.labelId] }),
		taskIdx: index('task_labels_task_idx').on(table.taskId),
		labelIdx: index('task_labels_label_idx').on(table.labelId),
	})
);

export type TaskLabel = typeof taskLabels.$inferSelect;
export type NewTaskLabel = typeof taskLabels.$inferInsert;
