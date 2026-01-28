import { pgTable, uuid, text, timestamp, bigint, boolean, jsonb } from 'drizzle-orm/pg-core';

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
 * User settings for the chat bot
 */
export const chatBotSettings = pgTable('chat_bot_settings', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' })
		.notNull()
		.unique()
		.references(() => telegramUsers.telegramUserId, { onDelete: 'cascade' }),
	currentModel: text('current_model'),
	currentConversationId: text('current_conversation_id'),
	preferences: jsonb('preferences').default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type ChatBotSettings = typeof chatBotSettings.$inferSelect;
export type NewChatBotSettings = typeof chatBotSettings.$inferInsert;
