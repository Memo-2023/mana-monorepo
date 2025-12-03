import { pgTable, uuid, varchar, time, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const alarms = pgTable('alarms', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	label: varchar('label', { length: 255 }),
	time: time('time').notNull(),
	enabled: boolean('enabled').default(true).notNull(),
	repeatDays: integer('repeat_days').array(), // [0-6] for weekdays (0=Sun)
	snoozeMinutes: integer('snooze_minutes').default(5),
	sound: varchar('sound', { length: 100 }).default('default'),
	vibrate: boolean('vibrate').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Alarm = typeof alarms.$inferSelect;
export type NewAlarm = typeof alarms.$inferInsert;
