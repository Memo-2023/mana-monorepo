import {
	pgTable,
	uuid,
	text,
	timestamp,
	bigint,
	boolean,
	integer,
	time,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * User settings stored in JSONB
 */
export interface UserSettings {
	language?: 'de' | 'en';
	defaultCalendarId?: string;
	quietHoursStart?: string; // HH:mm
	quietHoursEnd?: string; // HH:mm
}

/**
 * Telegram users linked to ManaCore accounts
 */
export const telegramUsers = pgTable(
	'telegram_users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		telegramUserId: bigint('telegram_user_id', { mode: 'number' }).unique().notNull(),
		telegramUsername: text('telegram_username'),
		telegramFirstName: text('telegram_first_name'),

		// ManaCore account link
		manaUserId: text('mana_user_id').notNull(),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),

		// Settings
		settings: jsonb('settings').$type<UserSettings>().default({}),
		isActive: boolean('is_active').default(true).notNull(),

		// Timestamps
		linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow().notNull(),
		lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		telegramUserIdx: index('telegram_users_telegram_id_idx').on(table.telegramUserId),
		manaUserIdx: index('telegram_users_mana_id_idx').on(table.manaUserId),
	})
);

/**
 * Reminder settings per user
 */
export const reminderSettings = pgTable(
	'reminder_settings',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		telegramUserId: bigint('telegram_user_id', { mode: 'number' })
			.references(() => telegramUsers.telegramUserId, { onDelete: 'cascade' })
			.notNull(),

		// Default reminder timing
		defaultReminderMinutes: integer('default_reminder_minutes').default(15).notNull(),

		// Morning briefing
		morningBriefingEnabled: boolean('morning_briefing_enabled').default(false).notNull(),
		morningBriefingTime: time('morning_briefing_time').default('07:00').notNull(),

		// Timezone
		timezone: text('timezone').default('Europe/Berlin').notNull(),

		// Notification preferences
		notifyEventReminders: boolean('notify_event_reminders').default(true).notNull(),
		notifyEventChanges: boolean('notify_event_changes').default(true).notNull(),
		notifySharedCalendars: boolean('notify_shared_calendars').default(true).notNull(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('reminder_settings_user_idx').on(table.telegramUserId),
	})
);

/**
 * Sent reminders log (to avoid duplicates)
 */
export const sentReminders = pgTable(
	'sent_reminders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		telegramUserId: bigint('telegram_user_id', { mode: 'number' })
			.references(() => telegramUsers.telegramUserId, { onDelete: 'cascade' })
			.notNull(),

		// Event reference
		eventId: text('event_id').notNull(),
		eventInstanceDate: timestamp('event_instance_date', { withTimezone: true }),

		// Reminder details
		reminderType: text('reminder_type').notNull(), // 'before_event' | 'morning_briefing'
		minutesBefore: integer('minutes_before'),

		// Status
		sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
		messageId: integer('message_id'), // Telegram message ID
	},
	(table) => ({
		userEventIdx: index('sent_reminders_user_event_idx').on(table.telegramUserId, table.eventId),
		sentAtIdx: index('sent_reminders_sent_at_idx').on(table.sentAt),
	})
);

// Relations
export const telegramUsersRelations = relations(telegramUsers, ({ one, many }) => ({
	reminderSettings: one(reminderSettings, {
		fields: [telegramUsers.telegramUserId],
		references: [reminderSettings.telegramUserId],
	}),
	sentReminders: many(sentReminders),
}));

export const reminderSettingsRelations = relations(reminderSettings, ({ one }) => ({
	user: one(telegramUsers, {
		fields: [reminderSettings.telegramUserId],
		references: [telegramUsers.telegramUserId],
	}),
}));

export const sentRemindersRelations = relations(sentReminders, ({ one }) => ({
	user: one(telegramUsers, {
		fields: [sentReminders.telegramUserId],
		references: [telegramUsers.telegramUserId],
	}),
}));

// Types
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type ReminderSetting = typeof reminderSettings.$inferSelect;
export type NewReminderSetting = typeof reminderSettings.$inferInsert;
export type SentReminder = typeof sentReminders.$inferSelect;
export type NewSentReminder = typeof sentReminders.$inferInsert;
