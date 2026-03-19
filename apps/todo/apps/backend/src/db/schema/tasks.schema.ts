import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	integer,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';
import { kanbanColumns } from './kanban-columns.schema';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
}

export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface EffectiveDuration {
	value: number;
	unit: DurationUnit;
}

export interface TaskMetadata {
	notes?: string;
	attachments?: string[];
	linkedCalendarEventId?: string | null;
	// Agile/Productivity metadata
	storyPoints?: number | null; // Fibonacci: 1, 2, 3, 5, 8, 13, 21
	effectiveDuration?: EffectiveDuration | null; // Actual time spent
	funRating?: number | null; // 1-10 scale
}

export const tasks = pgTable(
	'tasks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		parentTaskId: uuid('parent_task_id'),

		// Content
		title: varchar('title', { length: 500 }).notNull(),
		description: text('description'),

		// Scheduling
		dueDate: timestamp('due_date', { withTimezone: true }),
		dueTime: varchar('due_time', { length: 5 }),
		startDate: timestamp('start_date', { withTimezone: true }),

		// Time-Blocking (for calendar integration)
		scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
		scheduledStartTime: varchar('scheduled_start_time', { length: 5 }), // HH:mm
		scheduledEndTime: varchar('scheduled_end_time', { length: 5 }), // HH:mm
		estimatedDuration: integer('estimated_duration'), // in minutes

		// Priority & Status
		priority: varchar('priority', { length: 10 }).default('medium').$type<TaskPriority>(),
		status: varchar('status', { length: 20 }).default('pending').$type<TaskStatus>(),

		// Completion
		isCompleted: boolean('is_completed').default(false),
		completedAt: timestamp('completed_at', { withTimezone: true }),

		// Ordering
		order: integer('order').default(0),

		// Kanban
		columnId: uuid('column_id').references(() => kanbanColumns.id, { onDelete: 'set null' }),
		columnOrder: integer('column_order').default(0),

		// Recurrence (RFC 5545 RRULE format)
		recurrenceRule: varchar('recurrence_rule', { length: 500 }),
		recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
		lastOccurrence: timestamp('last_occurrence', { withTimezone: true }),

		// Subtasks stored as JSONB
		subtasks: jsonb('subtasks').$type<Subtask[]>(),

		// Metadata
		metadata: jsonb('metadata').$type<TaskMetadata>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		projectIdx: index('tasks_project_idx').on(table.projectId),
		userIdx: index('tasks_user_idx').on(table.userId),
		dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
		scheduledDateIdx: index('tasks_scheduled_date_idx').on(table.scheduledDate),
		statusIdx: index('tasks_status_idx').on(table.isCompleted, table.status),
		parentIdx: index('tasks_parent_idx').on(table.parentTaskId),
		orderIdx: index('tasks_order_idx').on(table.projectId, table.order),
		columnIdx: index('tasks_column_idx').on(table.columnId, table.columnOrder),
		// Composite indexes for common query patterns
		userProjectIdx: index('tasks_user_project_idx').on(table.userId, table.projectId),
		userStatusIdx: index('tasks_user_status_idx').on(table.userId, table.status),
		userDueDateIdx: index('tasks_user_due_date_idx').on(table.userId, table.dueDate),
		userCompletedIdx: index('tasks_user_completed_idx').on(table.userId, table.isCompleted),
		userScheduledDateIdx: index('tasks_user_scheduled_date_idx').on(
			table.userId,
			table.scheduledDate
		),
	})
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
