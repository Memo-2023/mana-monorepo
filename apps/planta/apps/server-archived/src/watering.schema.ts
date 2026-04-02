import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { plants } from './plants.schema';

export const wateringSchedules = pgTable('watering_schedules', {
	id: uuid('id').primaryKey().defaultRandom(),
	plantId: uuid('plant_id')
		.references(() => plants.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id').notNull(),

	// Schedule config
	frequencyDays: integer('frequency_days').notNull(),

	// Tracking
	lastWateredAt: timestamp('last_watered_at', { withTimezone: true }),
	nextWateringAt: timestamp('next_watering_at', { withTimezone: true }),

	// Notification preferences
	reminderEnabled: boolean('reminder_enabled').default(true).notNull(),
	reminderHoursBefore: integer('reminder_hours_before').default(24),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WateringSchedule = typeof wateringSchedules.$inferSelect;
export type NewWateringSchedule = typeof wateringSchedules.$inferInsert;

// Watering log for history tracking
export const wateringLogs = pgTable('watering_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	plantId: uuid('plant_id')
		.references(() => plants.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id').notNull(),

	wateredAt: timestamp('watered_at', { withTimezone: true }).defaultNow().notNull(),
	notes: text('notes'),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type WateringLog = typeof wateringLogs.$inferSelect;
export type NewWateringLog = typeof wateringLogs.$inferInsert;
