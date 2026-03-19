import { pgTable, uuid, text, timestamp, varchar, integer, index } from 'drizzle-orm/pg-core';
import { songs } from './songs.schema';

export const playlists = pgTable(
	'playlists',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		coverArtPath: text('cover_art_path'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('playlists_user_id_idx').on(table.userId)]
);

export const playlistSongs = pgTable(
	'playlist_songs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		playlistId: uuid('playlist_id')
			.references(() => playlists.id, { onDelete: 'cascade' })
			.notNull(),
		songId: uuid('song_id')
			.references(() => songs.id, { onDelete: 'cascade' })
			.notNull(),
		sortOrder: integer('sort_order').notNull(),
		addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('playlist_songs_playlist_id_idx').on(table.playlistId),
		index('playlist_songs_song_id_idx').on(table.songId),
	]
);

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type NewPlaylistSong = typeof playlistSongs.$inferInsert;
