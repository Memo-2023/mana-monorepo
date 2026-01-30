import {
	pgSchema,
	uuid,
	text,
	varchar,
	boolean,
	timestamp,
	uniqueIndex,
	jsonb,
} from 'drizzle-orm/pg-core';
import { notifySchema } from './notifications.schema';

export const preferences = notifySchema.table(
	'preferences',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Owner
		userId: text('user_id').notNull(),

		// Global settings
		emailEnabled: boolean('email_enabled').notNull().default(false),
		pushEnabled: boolean('push_enabled').notNull().default(true),

		// Quiet hours
		quietHoursEnabled: boolean('quiet_hours_enabled').notNull().default(false),
		quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // "22:00"
		quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // "08:00"
		timezone: varchar('timezone', { length: 50 }).notNull().default('Europe/Berlin'),

		// Per-category preferences
		// e.g., { "calendar": { "reminders": true, "shares": false }, "chat": { "messages": true } }
		categoryPreferences:
			jsonb('category_preferences').$type<Record<string, Record<string, boolean>>>(),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: uniqueIndex('preferences_user_id_idx').on(table.userId),
	})
);

export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;
