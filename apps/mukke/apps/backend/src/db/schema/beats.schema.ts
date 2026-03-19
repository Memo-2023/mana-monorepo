import { pgTable, uuid, text, timestamp, varchar, real, jsonb, index } from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';

export const beats = pgTable(
	'beats',
	{
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
		// STT Transcription fields
		transcriptionStatus: varchar('transcription_status', { length: 50 }).default('none'), // 'none' | 'pending' | 'completed' | 'failed'
		transcriptionError: text('transcription_error'),
		transcribedAt: timestamp('transcribed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('beats_project_id_idx').on(table.projectId)]
);

export type Beat = typeof beats.$inferSelect;
export type NewBeat = typeof beats.$inferInsert;
