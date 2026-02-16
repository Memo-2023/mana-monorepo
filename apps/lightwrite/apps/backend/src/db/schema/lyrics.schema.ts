import { pgTable, uuid, text, real, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';

export const lyrics = pgTable('lyrics', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.references(() => projects.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	content: text('content'),
});

export const lyricLines = pgTable('lyric_lines', {
	id: uuid('id').primaryKey().defaultRandom(),
	lyricsId: uuid('lyrics_id')
		.references(() => lyrics.id, { onDelete: 'cascade' })
		.notNull(),
	lineNumber: integer('line_number').notNull(),
	text: text('text').notNull(),
	startTime: real('start_time'),
	endTime: real('end_time'),
});

export type Lyrics = typeof lyrics.$inferSelect;
export type NewLyrics = typeof lyrics.$inferInsert;
export type LyricLine = typeof lyricLines.$inferSelect;
export type NewLyricLine = typeof lyricLines.$inferInsert;
