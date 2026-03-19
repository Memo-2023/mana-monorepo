import { pgTable, uuid, text, real, integer, index } from 'drizzle-orm/pg-core';
import { projects } from './projects.schema';

export const lyrics = pgTable(
	'lyrics',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		projectId: uuid('project_id')
			.references(() => projects.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),
		content: text('content'),
	},
	(table) => [index('lyrics_project_id_idx').on(table.projectId)]
);

export const lyricLines = pgTable(
	'lyric_lines',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		lyricsId: uuid('lyrics_id')
			.references(() => lyrics.id, { onDelete: 'cascade' })
			.notNull(),
		lineNumber: integer('line_number').notNull(),
		text: text('text').notNull(),
		startTime: real('start_time'),
		endTime: real('end_time'),
	},
	(table) => [index('lyric_lines_lyrics_id_idx').on(table.lyricsId)]
);

export type Lyrics = typeof lyrics.$inferSelect;
export type NewLyrics = typeof lyrics.$inferInsert;
export type LyricLine = typeof lyricLines.$inferSelect;
export type NewLyricLine = typeof lyricLines.$inferInsert;
