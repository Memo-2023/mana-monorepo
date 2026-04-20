/**
 * Reactive queries & pure helpers for Music — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalSong,
	LocalPlaylist,
	LocalPlaylistSong,
	LocalProject,
	LocalMarker,
	Song,
	Playlist,
	Project,
	Album,
	Artist,
	Genre,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toSong(local: LocalSong): Song {
	return {
		id: local.id,
		title: local.title,
		artist: local.artist ?? null,
		album: local.album ?? null,
		albumArtist: local.albumArtist ?? null,
		genre: local.genre ?? null,
		trackNumber: local.trackNumber ?? null,
		year: local.year ?? null,
		duration: local.duration ?? null,
		storagePath: local.storagePath,
		coverArtPath: local.coverArtPath ?? null,
		fileSize: local.fileSize ?? null,
		bpm: local.bpm ?? null,
		favorite: local.favorite,
		playCount: local.playCount,
		lastPlayedAt: local.lastPlayedAt ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toPlaylist(local: LocalPlaylist): Playlist {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? null,
		coverArtPath: local.coverArtPath ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toProject(local: LocalProject): Project {
	return {
		id: local.id,
		title: local.title,
		description: local.description ?? null,
		songId: local.songId ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All songs, sorted by title. */
export function useAllSongs() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalSong, string>('music', 'songs').toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		// title is encrypted on disk; sort needs the plaintext value.
		const decrypted = await decryptRecords('songs', visible);
		return decrypted.map(toSong).sort((a, b) => a.title.localeCompare(b.title));
	}, []);
}

/** All playlists, sorted by name. */
export function useAllPlaylists() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalPlaylist, string>(
			'music',
			'mukkePlaylists'
		).toArray();
		const visible = locals.filter((p) => !p.deletedAt);
		const decrypted = await decryptRecords('mukkePlaylists', visible);
		return decrypted.map(toPlaylist).sort((a, b) => a.name.localeCompare(b.name));
	}, []);
}

/** All playlist-song associations. */
export function useAllPlaylistSongs() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalPlaylistSong, string>(
			'music',
			'playlistSongs'
		).toArray();
		return locals.filter((ps) => !ps.deletedAt);
	}, []);
}

/** All projects, sorted by title. */
export function useAllProjects() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalProject, string>('music', 'mukkeProjects').toArray();
		return locals
			.filter((p) => !p.deletedAt)
			.map(toProject)
			.sort((a, b) => a.title.localeCompare(b.title));
	}, []);
}

/** All markers for a given beat ID. */
export function useMarkersByBeat(beatId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalMarker>('markers').where('beatId').equals(beatId).toArray();
		return locals.filter((m) => !m.deletedAt).sort((a, b) => a.startTime - b.startTime);
	}, []);
}

// ─── Pure Filter Functions ─────────────────────────────────

/** Filter songs by search query across title, artist, album. */
export function searchSongs(songs: Song[], query: string): Song[] {
	if (!query.trim()) return songs;
	const search = query.toLowerCase().trim();
	return songs.filter(
		(s) =>
			s.title?.toLowerCase().includes(search) ||
			s.artist?.toLowerCase().includes(search) ||
			s.album?.toLowerCase().includes(search)
	);
}

/** Filter songs to favorites only. */
export function filterFavorites(songs: Song[]): Song[] {
	return songs.filter((s) => s.favorite);
}

/** Filter songs by artist. */
export function filterByArtist(songs: Song[], artist: string): Song[] {
	if (!artist) return songs;
	return songs.filter((s) => s.artist === artist);
}

/** Filter songs by album. */
export function filterByAlbum(songs: Song[], album: string): Song[] {
	if (!album) return songs;
	return songs.filter((s) => s.album === album);
}

/** Filter songs by genre. */
export function filterByGenre(songs: Song[], genre: string): Song[] {
	if (!genre) return songs;
	return songs.filter((s) => s.genre === genre);
}

/** Get songs for a playlist, sorted by sortOrder. */
export function getPlaylistSongs(
	songs: Song[],
	playlistSongs: LocalPlaylistSong[],
	playlistId: string
): Song[] {
	const psForPlaylist = playlistSongs
		.filter((ps) => ps.playlistId === playlistId)
		.sort((a, b) => a.sortOrder - b.sortOrder);
	return psForPlaylist
		.map((ps) => songs.find((s) => s.id === ps.songId))
		.filter((s): s is Song => !!s);
}

/** Group songs by artist. */
export function groupByArtist(songs: Song[]): Album[] {
	const map = new Map<string, { songCount: number; albumCount: number }>();
	const artistAlbums = new Map<string, Set<string>>();
	for (const s of songs) {
		const key = s.artist || 'Unknown';
		if (!map.has(key)) {
			map.set(key, { songCount: 0, albumCount: 0 });
			artistAlbums.set(key, new Set());
		}
		map.get(key)!.songCount++;
		if (s.album) artistAlbums.get(key)!.add(s.album);
	}
	return Array.from(map.entries()).map(([artist, data]) => ({
		album: artist,
		albumArtist: artist,
		year: null,
		coverArtPath: null,
		songCount: data.songCount,
	}));
}

/** Group songs by album. */
export function groupByAlbum(songs: Song[]): Album[] {
	const albumMap = new Map<string, Album>();
	for (const s of songs) {
		const key = s.album || 'Unknown Album';
		if (!albumMap.has(key)) {
			albumMap.set(key, {
				album: key,
				albumArtist: s.albumArtist || s.artist || 'Unknown',
				year: s.year ?? null,
				coverArtPath: s.coverArtPath ?? null,
				songCount: 0,
			});
		}
		albumMap.get(key)!.songCount++;
	}
	return Array.from(albumMap.values());
}

/** Group songs by genre. */
export function groupByGenre(songs: Song[]): Genre[] {
	const genreMap = new Map<string, number>();
	for (const s of songs) {
		const key = s.genre || 'Unknown';
		genreMap.set(key, (genreMap.get(key) || 0) + 1);
	}
	return Array.from(genreMap.entries()).map(([genre, songCount]) => ({ genre, songCount }));
}

/** Compute library stats from songs. */
export function computeStats(songs: Song[]): {
	totalSongs: number;
	totalArtists: number;
	totalAlbums: number;
	totalGenres: number;
	totalDuration: number;
	totalPlays: number;
} {
	const artists = new Set(songs.map((s) => s.artist).filter(Boolean));
	const albums = new Set(songs.map((s) => s.album).filter(Boolean));
	const genres = new Set(songs.map((s) => s.genre).filter(Boolean));
	return {
		totalSongs: songs.length,
		totalArtists: artists.size,
		totalAlbums: albums.size,
		totalGenres: genres.size,
		totalDuration: songs.reduce((sum, s) => sum + (s.duration || 0), 0),
		totalPlays: songs.reduce((sum, s) => sum + (s.playCount || 0), 0),
	};
}

/** Format duration in seconds to m:ss. */
export function formatDuration(seconds: number | null | undefined): string {
	if (!seconds) return '0:00';
	return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
}
