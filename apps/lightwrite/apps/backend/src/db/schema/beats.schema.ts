import { pgTable, uuid, text, timestamp, varchar, real, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';

export const beats = pgTable('beats', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.references(() => projects.id, { onDelete: 'cascade' })
		.notNull(),
	storagePath: text('storage_path').notNull(),
	filename: varchar('filename', { length: 255 }),
	duration: real('duration'),
	bpm: real('bpm'),
	bpmConfidence: real('bpm_confidence'),
	waveformData: jsonb('waveform_data'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Beat = typeof beats.$inferSelect;
export type NewBeat = typeof beats.$inferInsert;
