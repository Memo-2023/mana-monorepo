import {
	pgTable,
	uuid,
	bigint,
	text,
	timestamp,
	boolean,
	time,
	varchar,
	integer,
} from 'drizzle-orm/pg-core';

/**
 * Telegram users linked to ManaCore accounts
 */
export const telegramUsers = pgTable('telegram_users', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull().unique(),
	telegramUsername: text('telegram_username'),
	telegramFirstName: text('telegram_first_name'),
	manaUserId: text('mana_user_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
	isActive: boolean('is_active').default(true),
	linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow(),
	lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * User-specific bot settings
 */
export const botSettings = pgTable('bot_settings', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' })
		.notNull()
		.unique()
		.references(() => telegramUsers.telegramUserId, { onDelete: 'cascade' }),

	// Birthday reminders
	birthdayRemindersEnabled: boolean('birthday_reminders_enabled').default(true),
	birthdayReminderTime: time('birthday_reminder_time').default('08:00'),
	birthdayReminderDays: integer('birthday_reminder_days').default(7),
	timezone: varchar('timezone', { length: 100 }).default('Europe/Berlin'),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Sent birthday reminders to avoid duplicates
 */
export const sentBirthdayReminders = pgTable('sent_birthday_reminders', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' })
		.notNull()
		.references(() => telegramUsers.telegramUserId, { onDelete: 'cascade' }),
	contactId: text('contact_id').notNull(),
	birthdayYear: integer('birthday_year').notNull(),
	sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
	messageId: integer('message_id'),
});

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type BotSetting = typeof botSettings.$inferSelect;
export type SentBirthdayReminder = typeof sentBirthdayReminders.$inferSelect;
