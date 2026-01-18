import { pgTable, uuid, text, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export interface PresetSettings {
	// For pomodoro presets
	workDuration?: number; // in seconds
	breakDuration?: number; // in seconds
	longBreakDuration?: number; // in seconds
	sessionsBeforeLongBreak?: number;
	// For timer presets
	sound?: string;
}

export const presets = pgTable('presets', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	type: varchar('type', { length: 20 }).notNull(), // 'timer' | 'pomodoro'
	name: varchar('name', { length: 255 }).notNull(),
	durationSeconds: integer('duration_seconds').notNull(),
	settings: jsonb('settings').$type<PresetSettings>(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Preset = typeof presets.$inferSelect;
export type NewPreset = typeof presets.$inferInsert;
