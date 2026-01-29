import {
	pgSchema,
	uuid,
	text,
	integer,
	boolean,
	timestamp,
	index,
	varchar,
} from 'drizzle-orm/pg-core';
import { notifySchema, channelEnum, notifications } from './notifications.schema';

export const deliveryLogs = notifySchema.table(
	'delivery_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Reference
		notificationId: uuid('notification_id')
			.notNull()
			.references(() => notifications.id, { onDelete: 'cascade' }),

		// Attempt info
		attemptNumber: integer('attempt_number').notNull(),
		channel: channelEnum('channel').notNull(),

		// Result
		success: boolean('success').notNull(),
		statusCode: integer('status_code'),
		errorMessage: text('error_message'),

		// Provider info
		providerId: varchar('provider_id', { length: 255 }), // Expo ticket ID, email message ID, etc.

		// Performance
		durationMs: integer('duration_ms'),

		// Timestamp
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		notificationIdIdx: index('delivery_logs_notification_id_idx').on(table.notificationId),
		successIdx: index('delivery_logs_success_idx').on(table.success),
		createdAtIdx: index('delivery_logs_created_at_idx').on(table.createdAt),
	})
);

export type DeliveryLog = typeof deliveryLogs.$inferSelect;
export type NewDeliveryLog = typeof deliveryLogs.$inferInsert;
