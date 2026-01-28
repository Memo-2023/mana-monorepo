import { pgTable, uuid, text, timestamp, varchar, boolean, index } from 'drizzle-orm/pg-core';

/**
 * Device tokens table - stores Expo push tokens for mobile notifications
 */
export const deviceTokens = pgTable(
	'device_tokens',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		pushToken: text('push_token').notNull().unique(),
		platform: varchar('platform', { length: 20 }).notNull(), // 'ios' | 'android'
		deviceName: varchar('device_name', { length: 255 }),
		isActive: boolean('is_active').default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('device_tokens_user_idx').on(table.userId),
		tokenIdx: index('device_tokens_token_idx').on(table.pushToken),
		activeIdx: index('device_tokens_active_idx').on(table.userId, table.isActive),
	})
);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;
