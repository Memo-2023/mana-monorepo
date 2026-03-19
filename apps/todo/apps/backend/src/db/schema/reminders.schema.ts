import { pgTable, uuid, text, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';
import { tasks } from './tasks.schema';

export type ReminderType = 'push' | 'email' | 'both';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export const reminders = pgTable(
	'reminders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		taskId: uuid('task_id')
			.notNull()
			.references(() => tasks.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),

		// Timing
		minutesBefore: integer('minutes_before').notNull(),
		reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),

		// Type
		type: varchar('type', { length: 20 }).default('push').$type<ReminderType>(),

		// Status
		status: varchar('status', { length: 20 }).default('pending').$type<ReminderStatus>(),
		sentAt: timestamp('sent_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		taskIdx: index('reminders_task_idx').on(table.taskId),
		userIdx: index('reminders_user_idx').on(table.userId),
		pendingIdx: index('reminders_pending_idx').on(table.status, table.reminderTime),
		// Composite indexes for user-scoped queries
		userPendingIdx: index('reminders_user_pending_idx').on(
			table.userId,
			table.status,
			table.reminderTime
		),
	})
);

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
