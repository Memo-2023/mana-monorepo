import { v4 as uuidv4 } from 'uuid';

import type { Playlist, PlaylistSong, Song } from '~/types';

import { getDatabase } from './database';

export async function createPlaylist(name: string, description?: string): Promise<Playlist> {
	const db = await getDatabase();
	const now = new Date().toISOString();
	const playlist: Playlist = {
		id: uuidv4(),
		name,
		description: description || null,
		coverArtPath: null,
		createdAt: now,
		updatedAt: now,
	};
	await db.runAsync(
		'INSERT INTO playlists (id, name, description, coverArtPath, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
		playlist.id,
		playlist.name,
		playlist.description,
		playlist.coverArtPath,
		playlist.createdAt,
		playlist.updatedAt
	);
	return playlist;
}

export async function getAllPlaylists(): Promise<Playlist[]> {
	const db = await getDatabase();
	return db.getAllAsync<Playlist>('SELECT * FROM playlists ORDER BY updatedAt DESC');
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
	const db = await getDatabase();
	return db.getFirstAsync<Playlist>('SELECT * FROM playlists WHERE id = ?', id);
}

export async function updatePlaylist(
	id: string,
	updates: { name?: string; description?: string }
): Promise<void> {
	const db = await getDatabase();
	const sets: string[] = ['updatedAt = ?'];
	const values: (string | null)[] = [new Date().toISOString()];

	if (updates.name !== undefined) {
		sets.push('name = ?');
		values.push(updates.name);
	}
	if (updates.description !== undefined) {
		sets.push('description = ?');
		values.push(updates.description);
	}

	values.push(id);
	await db.runAsync(`UPDATE playlists SET ${sets.join(', ')} WHERE id = ?`, ...values);
}

export async function deletePlaylist(id: string): Promise<void> {
	const db = await getDatabase();
	await db.runAsync('DELETE FROM playlists WHERE id = ?', id);
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
	const db = await getDatabase();
	const maxOrder = await db.getFirstAsync<{ maxOrder: number | null }>(
		'SELECT MAX(sortOrder) as maxOrder FROM playlist_songs WHERE playlistId = ?',
		playlistId
	);
	const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

	await db.runAsync(
		'INSERT INTO playlist_songs (id, playlistId, songId, sortOrder, addedAt) VALUES (?, ?, ?, ?, ?)',
		uuidv4(),
		playlistId,
		songId,
		sortOrder,
		new Date().toISOString()
	);

	await db.runAsync(
		'UPDATE playlists SET updatedAt = ? WHERE id = ?',
		new Date().toISOString(),
		playlistId
	);
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
	const db = await getDatabase();
	await db.runAsync(
		'DELETE FROM playlist_songs WHERE playlistId = ? AND songId = ?',
		playlistId,
		songId
	);
	await db.runAsync(
		'UPDATE playlists SET updatedAt = ? WHERE id = ?',
		new Date().toISOString(),
		playlistId
	);
}

export async function getPlaylistSongs(playlistId: string): Promise<Song[]> {
	const db = await getDatabase();
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		`SELECT s.* FROM songs s
		 INNER JOIN playlist_songs ps ON s.id = ps.songId
		 WHERE ps.playlistId = ?
		 ORDER BY ps.sortOrder ASC`,
		playlistId
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function getPlaylistSongCount(playlistId: string): Promise<number> {
	const db = await getDatabase();
	const row = await db.getFirstAsync<{ count: number }>(
		'SELECT COUNT(*) as count FROM playlist_songs WHERE playlistId = ?',
		playlistId
	);
	return row?.count ?? 0;
}
