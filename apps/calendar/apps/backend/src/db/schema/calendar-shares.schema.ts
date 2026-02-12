import { pgTable, uuid, timestamp, varchar, unique, text } from 'drizzle-orm/pg-core';
import { calendars } from './calendars.schema';

/**
 * Calendar shares table - stores calendar sharing information
 */
export const calendarShares = pgTable(
	'calendar_shares',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		calendarId: uuid('calendar_id')
			.notNull()
			.references(() => calendars.id, { onDelete: 'cascade' }),
		sharedWithUserId: text('shared_with_user_id'),
		sharedWithEmail: varchar('shared_with_email', { length: 255 }),

		// Permission level: read, write, admin
		permission: varchar('permission', { length: 20 }).notNull().default('read'),

		// Share link (for public/link sharing)
		shareToken: varchar('share_token', { length: 64 }),
		shareUrl: varchar('share_url', { length: 500 }),

		// Status: pending, accepted, declined
		status: varchar('status', { length: 20 }).default('pending'),

		// Metadata
		invitedBy: text('invited_by').notNull(),
		acceptedAt: timestamp('accepted_at', { withTimezone: true }),
		expiresAt: timestamp('expires_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		uniqueUserShare: unique().on(table.calendarId, table.sharedWithUserId),
		uniqueEmailShare: unique().on(table.calendarId, table.sharedWithEmail),
	})
);

export type CalendarShare = typeof calendarShares.$inferSelect;
export type NewCalendarShare = typeof calendarShares.$inferInsert;
