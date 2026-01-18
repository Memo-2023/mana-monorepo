import { pgTable, uuid, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const timers = pgTable('timers', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	label: varchar('label', { length: 255 }),
	durationSeconds: integer('duration_seconds').notNull(),
	remainingSeconds: integer('remaining_seconds'),
	status: varchar('status', { length: 20 }).default('idle').notNull(), // idle, running, paused, finished
	startedAt: timestamp('started_at', { withTimezone: true }),
	pausedAt: timestamp('paused_at', { withTimezone: true }),
	sound: varchar('sound', { length: 100 }).default('default'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Timer = typeof timers.$inferSelect;
export type NewTimer = typeof timers.$inferInsert;
