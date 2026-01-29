import {
	pgSchema,
	uuid,
	text,
	varchar,
	boolean,
	timestamp,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { notifySchema } from './notifications.schema';

export const devices = notifySchema.table(
	'devices',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Owner
		userId: text('user_id').notNull(),

		// Token
		pushToken: text('push_token').notNull(),
		tokenType: varchar('token_type', { length: 20 }).notNull().default('expo'), // expo, fcm, apns

		// Device Info
		platform: varchar('platform', { length: 20 }).notNull(), // ios, android, web
		deviceName: varchar('device_name', { length: 100 }),
		appId: varchar('app_id', { length: 50 }), // Which app registered this device

		// Status
		isActive: boolean('is_active').notNull().default(true),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('devices_user_id_idx').on(table.userId),
		pushTokenIdx: uniqueIndex('devices_push_token_idx').on(table.pushToken),
		platformIdx: index('devices_platform_idx').on(table.platform),
	})
);

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
