import { pgTable, uuid, text, timestamp, bigint, boolean } from 'drizzle-orm/pg-core';

// Telegram users - Mapping Telegram User <-> Todo User
export const telegramUsers = pgTable('telegram_users', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull().unique(),
	telegramUsername: text('telegram_username'),
	// Linking with mana-core-auth
	manaUserId: text('mana_user_id'),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	tokenExpiresAt: timestamp('token_expires_at'),
	// Settings
	dailyReminderEnabled: boolean('daily_reminder_enabled').default(false).notNull(),
	dailyReminderTime: text('daily_reminder_time').default('08:00').notNull(),
	timezone: text('timezone').default('Europe/Berlin').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
