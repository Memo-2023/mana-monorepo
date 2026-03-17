import type { Album, Artist, Genre, Song } from '~/types';

import { getDatabase } from './database';
import { deleteFile } from './fileService';

export async function insertSong(song: Song): Promise<void> {
	const db = await getDatabase();
	await db.runAsync(
		`INSERT INTO songs (id, title, artist, album, albumArtist, genre, trackNumber, discNumber, year, duration, filePath, fileSize, coverArtPath, addedAt, lastPlayedAt, playCount, favorite)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		song.id,
		song.title,
		song.artist,
		song.album,
		song.albumArtist,
		song.genre,
		song.trackNumber,
		song.discNumber,
		song.year,
		song.duration,
		song.filePath,
		song.fileSize,
		song.coverArtPath,
		song.addedAt,
		song.lastPlayedAt,
		song.playCount,
		song.favorite ? 1 : 0
	);
}

export async function getAllSongs(
	orderBy: string = 'title',
	direction: 'ASC' | 'DESC' = 'ASC'
): Promise<Song[]> {
	const db = await getDatabase();
	const validColumns = ['title', 'artist', 'album', 'addedAt', 'playCount'];
	const col = validColumns.includes(orderBy) ? orderBy : 'title';
	const dir = direction === 'DESC' ? 'DESC' : 'ASC';
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		`SELECT * FROM songs ORDER BY ${col} ${dir}`
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function getSongById(id: string): Promise<Song | null> {
	const db = await getDatabase();
	const row = await db.getFirstAsync<Song & { favorite: number }>(
		'SELECT * FROM songs WHERE id = ?',
		id
	);
	if (!row) return null;
	return { ...row, favorite: row.favorite === 1 };
}

export async function deleteSong(id: string): Promise<void> {
	const db = await getDatabase();
	const song = await getSongById(id);
	if (song) {
		await deleteFile(song.filePath);
		if (song.coverArtPath) {
			await deleteFile(song.coverArtPath);
		}
	}
	await db.runAsync('DELETE FROM songs WHERE id = ?', id);
}

export async function toggleFavorite(id: string): Promise<boolean> {
	const db = await getDatabase();
	const song = await getSongById(id);
	if (!song) return false;
	const newFav = !song.favorite;
	await db.runAsync('UPDATE songs SET favorite = ? WHERE id = ?', newFav ? 1 : 0, id);
	return newFav;
}

export async function updatePlayStats(id: string): Promise<void> {
	const db = await getDatabase();
	await db.runAsync(
		'UPDATE songs SET playCount = playCount + 1, lastPlayedAt = ? WHERE id = ?',
		new Date().toISOString(),
		id
	);
}

export async function updateSongDuration(id: string, duration: number): Promise<void> {
	const db = await getDatabase();
	await db.runAsync('UPDATE songs SET duration = ? WHERE id = ?', duration, id);
}

export async function getAlbums(): Promise<Album[]> {
	const db = await getDatabase();
	return db.getAllAsync<Album>(`
		SELECT
			album AS name,
			COALESCE(albumArtist, artist) AS artist,
			year,
			(SELECT coverArtPath FROM songs s2 WHERE s2.album = songs.album AND s2.coverArtPath IS NOT NULL LIMIT 1) AS coverArtPath,
			COUNT(*) AS songCount
		FROM songs
		WHERE album IS NOT NULL AND album != ''
		GROUP BY album
		ORDER BY album ASC
	`);
}

export async function getSongsByAlbum(albumName: string): Promise<Song[]> {
	const db = await getDatabase();
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		'SELECT * FROM songs WHERE album = ? ORDER BY discNumber ASC, trackNumber ASC, title ASC',
		albumName
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function getArtists(): Promise<Artist[]> {
	const db = await getDatabase();
	return db.getAllAsync<Artist>(`
		SELECT
			artist AS name,
			COUNT(*) AS songCount,
			COUNT(DISTINCT album) AS albumCount
		FROM songs
		WHERE artist IS NOT NULL AND artist != ''
		GROUP BY artist
		ORDER BY artist ASC
	`);
}

export async function getSongsByArtist(artistName: string): Promise<Song[]> {
	const db = await getDatabase();
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		'SELECT * FROM songs WHERE artist = ? ORDER BY album ASC, trackNumber ASC, title ASC',
		artistName
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function getGenres(): Promise<Genre[]> {
	const db = await getDatabase();
	return db.getAllAsync<Genre>(`
		SELECT
			genre AS name,
			COUNT(*) AS songCount
		FROM songs
		WHERE genre IS NOT NULL AND genre != ''
		GROUP BY genre
		ORDER BY genre ASC
	`);
}

export async function getSongsByGenre(genreName: string): Promise<Song[]> {
	const db = await getDatabase();
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		'SELECT * FROM songs WHERE genre = ? ORDER BY artist ASC, album ASC, trackNumber ASC',
		genreName
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function searchSongs(query: string): Promise<Song[]> {
	const db = await getDatabase();
	const q = `%${query}%`;
	const rows = await db.getAllAsync<Song & { favorite: number }>(
		'SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR album LIKE ? ORDER BY title ASC LIMIT 50',
		q,
		q,
		q
	);
	return rows.map((r) => ({ ...r, favorite: r.favorite === 1 }));
}

export async function getSongCount(): Promise<number> {
	const db = await getDatabase();
	const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM songs');
	return row?.count ?? 0;
}
