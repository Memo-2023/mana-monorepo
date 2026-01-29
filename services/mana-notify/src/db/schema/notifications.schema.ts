import {
	pgSchema,
	uuid,
	text,
	varchar,
	integer,
	timestamp,
	index,
	jsonb,
} from 'drizzle-orm/pg-core';

export const notifySchema = pgSchema('notify');

// Channel enum
export const channelEnum = notifySchema.enum('channel', ['email', 'push', 'matrix', 'webhook']);

// Status enum
export const statusEnum = notifySchema.enum('notification_status', [
	'pending',
	'processing',
	'delivered',
	'failed',
	'cancelled',
]);

// Priority enum
export const priorityEnum = notifySchema.enum('priority', ['low', 'normal', 'high', 'critical']);

export const notifications = notifySchema.table(
	'notifications',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Target
		userId: text('user_id'),
		appId: varchar('app_id', { length: 50 }).notNull(), // calendar, chat, auth, etc.

		// Channel & Template
		channel: channelEnum('channel').notNull(),
		templateId: varchar('template_id', { length: 100 }),

		// Content
		subject: varchar('subject', { length: 500 }),
		body: text('body'),
		data: jsonb('data').$type<Record<string, unknown>>(), // Template variables

		// Delivery
		status: statusEnum('status').notNull().default('pending'),
		priority: priorityEnum('priority').notNull().default('normal'),
		scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
		recipient: varchar('recipient', { length: 500 }), // Email, Matrix Room, Webhook URL

		// Idempotency
		externalId: varchar('external_id', { length: 255 }),

		// Processing
		attempts: integer('attempts').notNull().default(0),
		deliveredAt: timestamp('delivered_at', { withTimezone: true }),
		errorMessage: text('error_message'),

		// Timestamps
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index('notifications_user_id_idx').on(table.userId),
		appIdIdx: index('notifications_app_id_idx').on(table.appId),
		statusIdx: index('notifications_status_idx').on(table.status),
		scheduledForIdx: index('notifications_scheduled_for_idx').on(table.scheduledFor),
		externalIdIdx: index('notifications_external_id_idx').on(table.externalId),
	})
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
