/**
 * Library Store — Mutation + API Operations
 *
 * Reads for songs list are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store handles:
 * - Mutations that write to IndexedDB (toggle favorite, delete)
 * - API-only operations (upload, cover URLs, metadata extraction, write tags)
 * - Aggregated views from backend (albums, artists, genres, stats)
 *
 * The live queries will automatically pick up local changes.
 */

import type {
	Song,
	Album,
	Artist,
	Genre,
	LibraryStats,
	SortField,
	SortDirection,
} from '@mukke/shared';
import { authStore } from './auth.svelte';
import { songCollection, type LocalSong } from '$lib/data/local-store';
import { trackEvent } from '@manacore/shared-utils/analytics';

interface LibraryState {
	albums: Album[];
	artists: Artist[];
	genres: Genre[];
	stats: LibraryStats | null;
	coverUrls: Record<string, string>;
	activeTab: 'songs' | 'albums' | 'artists' | 'genres';
	sortField: SortField;
	sortDirection: SortDirection;
	isLoading: boolean;
	error: string | null;
}

function getBackendUrl(): string {
	let baseUrl = 'http://localhost:3010';
	if (typeof window !== 'undefined') {
		baseUrl =
			(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
			'http://localhost:3010';
	}
	// Ensure API prefix is included
	return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
}

function createLibraryStore() {
	let state = $state<LibraryState>({
		albums: [],
		artists: [],
		genres: [],
		stats: null,
		coverUrls: {},
		activeTab: 'songs',
		sortField: 'addedAt' as SortField,
		sortDirection: 'desc' as SortDirection,
		isLoading: false,
		error: null,
	});

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const authHeaders = await authStore.getAuthHeaders();
		const response = await fetch(`${getBackendUrl()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...authHeaders,
				...options.headers,
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(error.message || 'Request failed');
		}

		return response.json();
	}

	return {
		get albums() {
			return state.albums;
		},
		get artists() {
			return state.artists;
		},
		get genres() {
			return state.genres;
		},
		get stats() {
			return state.stats;
		},
		get activeTab() {
			return state.activeTab;
		},
		get sortField() {
			return state.sortField;
		},
		get sortDirection() {
			return state.sortDirection;
		},
		get isLoading() {
			return state.isLoading;
		},
		get coverUrls() {
			return state.coverUrls;
		},
		get error() {
			return state.error;
		},

		async loadCoverUrls(paths: string[]) {
			// Filter out non-image paths (e.g. .mp3 storagePaths stored as coverArtPath by mistake)
			const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i;
			const uncached = paths.filter((p) => p && !state.coverUrls[p] && imageExtensions.test(p));
			if (uncached.length === 0) return;
			try {
				const data = await fetchApi<{ urls: Record<string, string> }>('/library/cover-urls', {
					method: 'POST',
					body: JSON.stringify({ paths: uncached }),
				});
				state.coverUrls = { ...state.coverUrls, ...data.urls };
			} catch {
				// Cover URLs are non-critical, don't set error
			}
		},

		/** Load albums from backend (aggregated view). */
		async loadAlbums() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ albums: Album[] }>('/library/albums');
				state.albums = data.albums;
				const coverPaths = data.albums.map((a) => a.coverArtPath).filter((p): p is string => !!p);
				if (coverPaths.length > 0) this.loadCoverUrls(coverPaths);
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load albums';
			}
			state.isLoading = false;
		},

		/** Load artists from backend (aggregated view). */
		async loadArtists() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ artists: Artist[] }>('/library/artists');
				state.artists = data.artists;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load artists';
			}
			state.isLoading = false;
		},

		/** Load genres from backend (aggregated view). */
		async loadGenres() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ genres: Genre[] }>('/library/genres');
				state.genres = data.genres;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load genres';
			}
			state.isLoading = false;
		},

		/** Load stats from backend. */
		async loadStats() {
			try {
				const data = await fetchApi<{ stats: LibraryStats }>('/library/stats');
				state.stats = data.stats;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load stats';
			}
		},

		/** Toggle favorite — writes to IndexedDB instantly. */
		async toggleFavorite(id: string) {
			const local = await songCollection.get(id);
			if (local) {
				await songCollection.update(id, { favorite: !local.favorite } as Partial<LocalSong>);
			}
			// Also update backend
			try {
				await fetchApi<{ song: Song }>(`/songs/${id}/favorite`, { method: 'PUT' });
			} catch {
				// Sync will reconcile
			}
		},

		async incrementPlayCount(id: string) {
			const local = await songCollection.get(id);
			if (local) {
				await songCollection.update(id, {
					playCount: (local.playCount || 0) + 1,
					lastPlayedAt: new Date().toISOString(),
				} as Partial<LocalSong>);
			}
			try {
				await fetchApi<{ song: Song }>(`/songs/${id}/play`, { method: 'PUT' });
			} catch {
				// Sync will reconcile
			}
		},

		/** Search songs from IndexedDB. */
		async searchSongs(query: string) {
			const all = await songCollection.getAll();
			const q = query.toLowerCase();
			return all
				.filter(
					(s) =>
						s.title?.toLowerCase().includes(q) ||
						s.artist?.toLowerCase().includes(q) ||
						s.album?.toLowerCase().includes(q)
				)
				.slice(0, 20) as unknown as Song[];
		},

		/** Delete song — removes from IndexedDB instantly + backend. */
		async deleteSong(id: string) {
			await songCollection.delete(id);
			try {
				await fetchApi(`/songs/${id}`, { method: 'DELETE' });
			} catch {
				// Sync will reconcile
			}
		},

		setActiveTab(tab: 'songs' | 'albums' | 'artists' | 'genres') {
			state.activeTab = tab;
			if (tab === 'albums' && state.albums.length === 0) {
				this.loadAlbums();
			} else if (tab === 'artists' && state.artists.length === 0) {
				this.loadArtists();
			} else if (tab === 'genres' && state.genres.length === 0) {
				this.loadGenres();
			}
		},

		/** Upload song via API, then store metadata in IndexedDB. */
		async uploadSong(file: File) {
			const uploadData = await fetchApi<{ song: Song; uploadUrl: string }>('/songs/upload', {
				method: 'POST',
				body: JSON.stringify({
					filename: file.name,
					fileLastModified: file.lastModified || undefined,
				}),
			});

			await fetch(uploadData.uploadUrl, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': file.type },
			});

			// Write to IndexedDB so liveQuery picks it up
			const localSong: LocalSong = {
				id: uploadData.song.id,
				title: uploadData.song.title || file.name,
				artist: uploadData.song.artist ?? null,
				album: uploadData.song.album ?? null,
				albumArtist: uploadData.song.albumArtist ?? null,
				genre: uploadData.song.genre ?? null,
				trackNumber: uploadData.song.trackNumber ?? null,
				year: uploadData.song.year ?? null,
				duration: uploadData.song.duration ?? null,
				storagePath: uploadData.song.storagePath,
				coverArtPath: uploadData.song.coverArtPath ?? null,
				fileSize: uploadData.song.fileSize ?? null,
				bpm: uploadData.song.bpm ?? null,
				favorite: false,
				playCount: 0,
				lastPlayedAt: null,
			};
			await songCollection.insert(localSong);

			trackEvent('song_uploaded');
			return uploadData.song;
		},

		/** Update song metadata — writes to IndexedDB + backend. */
		async updateSongMetadata(id: string, data: Partial<Song>) {
			const updateData: Partial<LocalSong> = {};
			if (data.title !== undefined) updateData.title = data.title;
			if (data.artist !== undefined) updateData.artist = data.artist ?? null;
			if (data.album !== undefined) updateData.album = data.album ?? null;
			if (data.albumArtist !== undefined) updateData.albumArtist = data.albumArtist ?? null;
			if (data.genre !== undefined) updateData.genre = data.genre ?? null;
			if (data.trackNumber !== undefined) updateData.trackNumber = data.trackNumber ?? null;
			if (data.year !== undefined) updateData.year = data.year ?? null;
			if (data.bpm !== undefined) updateData.bpm = data.bpm ?? null;

			await songCollection.update(id, updateData);

			// Also update backend
			try {
				const result = await fetchApi<{ song: Song }>(`/songs/${id}`, {
					method: 'PUT',
					body: JSON.stringify(data),
				});
				return result.song;
			} catch {
				// Sync will reconcile
				return data as Song;
			}
		},

		/** Extract metadata from file — server-side operation, then update IndexedDB. */
		async extractMetadata(id: string) {
			const result = await fetchApi<{ song: Song }>(`/songs/${id}/extract-metadata`, {
				method: 'POST',
			});
			// Update IndexedDB with extracted metadata
			const updateData: Partial<LocalSong> = {
				title: result.song.title,
				artist: result.song.artist ?? null,
				album: result.song.album ?? null,
				albumArtist: result.song.albumArtist ?? null,
				genre: result.song.genre ?? null,
				trackNumber: result.song.trackNumber ?? null,
				year: result.song.year ?? null,
				duration: result.song.duration ?? null,
				coverArtPath: result.song.coverArtPath ?? null,
				bpm: result.song.bpm ?? null,
			};
			await songCollection.update(id, updateData);
			return result.song;
		},

		async writeTags(id: string) {
			await fetchApi<{ success: boolean }>(`/songs/${id}/write-tags`, {
				method: 'POST',
			});
		},

		async getCoverUrl(id: string): Promise<string | null> {
			const result = await fetchApi<{ url: string | null }>(`/songs/${id}/cover-url`);
			return result.url;
		},
	};
}

export const libraryStore = createLibraryStore();
