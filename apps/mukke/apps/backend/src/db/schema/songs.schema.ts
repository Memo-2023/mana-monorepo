import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	integer,
	real,
	boolean,
	index,
} from 'drizzle-orm/pg-core';

export const songs = pgTable(
	'songs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		artist: varchar('artist', { length: 255 }),
		album: varchar('album', { length: 255 }),
		albumArtist: varchar('album_artist', { length: 255 }),
		genre: varchar('genre', { length: 100 }),
		trackNumber: integer('track_number'),
		year: integer('year'),
		month: integer('month'),
		day: integer('day'),
		duration: real('duration'),
		storagePath: text('storage_path').notNull(),
		coverArtPath: text('cover_art_path'),
		fileSize: integer('file_size'),
		bpm: real('bpm'),
		favorite: boolean('favorite').default(false).notNull(),
		playCount: integer('play_count').default(0).notNull(),
		lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('songs_user_id_idx').on(table.userId),
		index('songs_added_at_idx').on(table.addedAt),
	]
);

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
