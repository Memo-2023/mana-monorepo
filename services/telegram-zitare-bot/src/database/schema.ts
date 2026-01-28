import { pgTable, uuid, text, timestamp, bigint, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Telegram users
export const telegramUsers = pgTable('telegram_users', {
	id: uuid('id').primaryKey().defaultRandom(),
	telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull().unique(),
	telegramUsername: text('telegram_username'),
	dailyEnabled: boolean('daily_enabled').default(false).notNull(),
	dailyTime: text('daily_time').default('08:00').notNull(),
	timezone: text('timezone').default('Europe/Berlin').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User favorites
export const userFavorites = pgTable(
	'user_favorites',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
		quoteId: text('quote_id').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	(table) => [unique().on(table.telegramUserId, table.quoteId)]
);

// Relations
export const telegramUsersRelations = relations(telegramUsers, ({ many }) => ({
	favorites: many(userFavorites),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
	user: one(telegramUsers, {
		fields: [userFavorites.telegramUserId],
		references: [telegramUsers.telegramUserId],
	}),
}));

// Types
export type TelegramUser = typeof telegramUsers.$inferSelect;
export type NewTelegramUser = typeof telegramUsers.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
