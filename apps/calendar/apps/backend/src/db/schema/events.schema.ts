import { pgTable, uuid, timestamp, varchar, text, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { calendars } from './calendars.schema';

/**
 * Event attendee information
 */
export interface EventAttendee {
	email: string;
	name?: string;
	status?: 'accepted' | 'declined' | 'tentative' | 'pending';
}

/**
 * Event metadata stored in JSONB
 */
export interface EventMetadata {
	url?: string;
	conferenceUrl?: string;
	attendees?: EventAttendee[];
	organizer?: string;
	priority?: 'low' | 'normal' | 'high';
	tags?: string[];
}

/**
 * Events table - stores calendar events
 */
export const events = pgTable(
	'events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		calendarId: uuid('calendar_id')
			.notNull()
			.references(() => calendars.id, { onDelete: 'cascade' }),
		userId: uuid('user_id').notNull(),

		// Basic info
		title: varchar('title', { length: 500 }).notNull(),
		description: text('description'),
		location: varchar('location', { length: 500 }),

		// Timing
		startTime: timestamp('start_time', { withTimezone: true }).notNull(),
		endTime: timestamp('end_time', { withTimezone: true }).notNull(),
		isAllDay: boolean('is_all_day').default(false),
		timezone: varchar('timezone', { length: 100 }).default('Europe/Berlin'),

		// Recurrence (RFC 5545 RRULE format)
		recurrenceRule: varchar('recurrence_rule', { length: 500 }),
		recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
		recurrenceExceptions: jsonb('recurrence_exceptions').$type<string[]>(),
		parentEventId: uuid('parent_event_id'),

		// Appearance
		color: varchar('color', { length: 7 }),

		// Status
		status: varchar('status', { length: 20 }).default('confirmed'),

		// External sync
		externalId: varchar('external_id', { length: 255 }),
		externalCalendarId: uuid('external_calendar_id'),
		lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),

		// Metadata
		metadata: jsonb('metadata').$type<EventMetadata>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		calendarIdx: index('events_calendar_idx').on(table.calendarId),
		userIdx: index('events_user_idx').on(table.userId),
		timeRangeIdx: index('events_time_range_idx').on(table.startTime, table.endTime),
		externalIdx: index('events_external_idx').on(table.externalId, table.externalCalendarId),
	})
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
