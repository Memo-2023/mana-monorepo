/**
 * Reactive Queries & Pure Filter Helpers for Mukke
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 *
 * NOTE: Mukke's library/playlist/project stores still use backend API calls
 * for most operations (upload, streaming, metadata extraction, etc.).
 * These queries provide reactive reads from IndexedDB for the local-first
 * collections. The stores remain for API-driven mutations.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	songCollection,
	playlistCollection,
	playlistSongCollection,
	projectCollection,
	markerCollection,
	type LocalSong,
	type LocalPlaylist,
	type LocalPlaylistSong,
	type LocalProject,
	type LocalMarker,
} from './local-store';

// ─── Live Query Hooks (call during component init) ──────────

/** All songs, sorted by title. Auto-updates on any change. */
export function useAllSongs() {
	return useLiveQueryWithDefault(async () => {
		return songCollection.getAll(undefined, {
			sortBy: 'title',
			sortDirection: 'asc',
		});
	}, [] as LocalSong[]);
}

/** All playlists, sorted by name. Auto-updates on any change. */
export function useAllPlaylists() {
	return useLiveQueryWithDefault(async () => {
		return playlistCollection.getAll(undefined, {
			sortBy: 'name',
			sortDirection: 'asc',
		});
	}, [] as LocalPlaylist[]);
}

/** All playlist-song associations. Auto-updates on any change. */
export function useAllPlaylistSongs() {
	return useLiveQueryWithDefault(async () => {
		return playlistSongCollection.getAll();
	}, [] as LocalPlaylistSong[]);
}

/** All projects, sorted by title. Auto-updates on any change. */
export function useAllProjects() {
	return useLiveQueryWithDefault(async () => {
		return projectCollection.getAll(undefined, {
			sortBy: 'title',
			sortDirection: 'asc',
		});
	}, [] as LocalProject[]);
}

/** All markers for a given beat ID. */
export function useMarkersByBeat(beatId: string) {
	return useLiveQueryWithDefault(async () => {
		const all = await markerCollection.getAll();
		return all.filter((m) => m.beatId === beatId).sort((a, b) => a.startTime - b.startTime);
	}, [] as LocalMarker[]);
}

// ─── Pure Filter Functions (for $derived) ───────────────────

/** Filter songs by search query across title, artist, album. */
export function searchSongs(songs: LocalSong[], query: string): LocalSong[] {
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
export function filterFavorites(songs: LocalSong[]): LocalSong[] {
	return songs.filter((s) => s.favorite);
}

/** Filter songs by artist. */
export function filterByArtist(songs: LocalSong[], artist: string): LocalSong[] {
	if (!artist) return songs;
	return songs.filter((s) => s.artist === artist);
}

/** Filter songs by album. */
export function filterByAlbum(songs: LocalSong[], album: string): LocalSong[] {
	if (!album) return songs;
	return songs.filter((s) => s.album === album);
}

/** Filter songs by genre. */
export function filterByGenre(songs: LocalSong[], genre: string): LocalSong[] {
	if (!genre) return songs;
	return songs.filter((s) => s.genre === genre);
}

/** Get songs for a playlist, sorted by sortOrder. */
export function getPlaylistSongs(
	songs: LocalSong[],
	playlistSongs: LocalPlaylistSong[],
	playlistId: string
): LocalSong[] {
	const psForPlaylist = playlistSongs
		.filter((ps) => ps.playlistId === playlistId)
		.sort((a, b) => a.sortOrder - b.sortOrder);
	return psForPlaylist
		.map((ps) => songs.find((s) => s.id === ps.songId))
		.filter((s): s is LocalSong => !!s);
}

/** Group songs by artist. */
export function groupByArtist(songs: LocalSong[]): Record<string, LocalSong[]> {
	const groups: Record<string, LocalSong[]> = {};
	for (const song of songs) {
		const key = song.artist || 'Unknown Artist';
		if (!groups[key]) groups[key] = [];
		groups[key].push(song);
	}
	return groups;
}

/** Group songs by album. */
export function groupByAlbum(songs: LocalSong[]): Record<string, LocalSong[]> {
	const groups: Record<string, LocalSong[]> = {};
	for (const song of songs) {
		const key = song.album || 'Unknown Album';
		if (!groups[key]) groups[key] = [];
		groups[key].push(song);
	}
	return groups;
}

/** Group songs by genre. */
export function groupByGenre(songs: LocalSong[]): Record<string, LocalSong[]> {
	const groups: Record<string, LocalSong[]> = {};
	for (const song of songs) {
		const key = song.genre || 'Unknown Genre';
		if (!groups[key]) groups[key] = [];
		groups[key].push(song);
	}
	return groups;
}
