import { pgTable, uuid, timestamp, varchar, text, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * Calendar settings stored in JSONB
 */
export interface CalendarSettings {
	defaultView?: 'day' | 'week' | 'month' | 'year' | 'agenda';
	weekStartsOn?: 0 | 1;
	showWeekNumbers?: boolean;
	defaultEventDuration?: number;
	defaultReminder?: number;
}

/**
 * Calendars table - stores user calendars
 */
export const calendars = pgTable('calendars', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	color: varchar('color', { length: 7 }).default('#3B82F6'),
	isDefault: boolean('is_default').default(false),
	isVisible: boolean('is_visible').default(true),
	timezone: varchar('timezone', { length: 100 }).default('Europe/Berlin'),
	settings: jsonb('settings').$type<CalendarSettings>(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
