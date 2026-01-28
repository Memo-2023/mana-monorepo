import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	integer,
	boolean,
	index,
} from 'drizzle-orm/pg-core';
import { events } from './events.schema';

/**
 * Reminders table - stores event reminders
 */
export const reminders = pgTable(
	'reminders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),

		// User email for email notifications (stored at creation time)
		userEmail: varchar('user_email', { length: 255 }),

		// Timing
		minutesBefore: integer('minutes_before').notNull(),
		reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),

		// Notification channels
		notifyPush: boolean('notify_push').default(true),
		notifyEmail: boolean('notify_email').default(false),

		// Status: pending, sent, failed, cancelled
		status: varchar('status', { length: 20 }).default('pending'),
		sentAt: timestamp('sent_at', { withTimezone: true }),

		// For recurring events - which instance this reminder is for
		eventInstanceDate: timestamp('event_instance_date', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		eventIdx: index('reminders_event_idx').on(table.eventId),
		userIdx: index('reminders_user_idx').on(table.userId),
		pendingIdx: index('reminders_pending_idx').on(table.status, table.reminderTime),
	})
);

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
