import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	boolean,
	jsonb,
	integer,
	index,
} from 'drizzle-orm/pg-core';

/**
 * Provider-specific metadata
 */
export interface ExternalCalendarProviderData {
	googleCalendarId?: string;
	appleCalendarId?: string;
	caldavCalendarId?: string;
	caldavEtag?: string;
	caldavCtag?: string;
	icalLastModified?: string;
	icalEtag?: string;
}

/**
 * External calendars table - stores CalDAV/iCal connections
 */
export const externalCalendars = pgTable(
	'external_calendars',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),

		// Calendar identification
		name: varchar('name', { length: 255 }).notNull(),
		provider: varchar('provider', { length: 50 }).notNull(), // google, apple, caldav, ical_url

		// Connection details
		calendarUrl: text('calendar_url').notNull(),
		username: varchar('username', { length: 255 }),
		encryptedPassword: text('encrypted_password'),

		// OAuth tokens (for Google, etc.)
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

		// Sync settings
		syncEnabled: boolean('sync_enabled').default(true),
		syncDirection: varchar('sync_direction', { length: 20 }).default('both'), // import, export, both
		syncInterval: integer('sync_interval').default(15), // Minutes between syncs
		lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
		lastSyncError: text('last_sync_error'),

		// Display settings
		color: varchar('color', { length: 7 }).default('#6B7280'),
		isVisible: boolean('is_visible').default(true),

		// Provider-specific metadata
		providerData: jsonb('provider_data').$type<ExternalCalendarProviderData>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('external_calendars_user_idx').on(table.userId),
		providerIdx: index('external_calendars_provider_idx').on(table.provider, table.userId),
		syncEnabledIdx: index('external_calendars_sync_enabled_idx').on(
			table.syncEnabled,
			table.lastSyncAt
		),
	})
);

export type ExternalCalendar = typeof externalCalendars.$inferSelect;
export type NewExternalCalendar = typeof externalCalendars.$inferInsert;
