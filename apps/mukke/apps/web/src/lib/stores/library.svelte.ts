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

interface LibraryState {
	songs: Song[];
	albums: Album[];
	artists: Artist[];
	genres: Genre[];
	stats: LibraryStats | null;
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
		songs: [],
		albums: [],
		artists: [],
		genres: [],
		stats: null,
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
		get songs() {
			return state.songs;
		},
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
		get error() {
			return state.error;
		},

		async loadSongs() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ songs: Song[] }>(
					`/songs?sort=${state.sortField}&direction=${state.sortDirection}`
				);
				state.songs = data.songs;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load songs';
			}
			state.isLoading = false;
		},

		async loadAlbums() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ albums: Album[] }>('/library/albums');
				state.albums = data.albums;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load albums';
			}
			state.isLoading = false;
		},

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

		async loadStats() {
			try {
				const data = await fetchApi<{ stats: LibraryStats }>('/library/stats');
				state.stats = data.stats;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load stats';
			}
		},

		async loadAll() {
			state.isLoading = true;
			state.error = null;
			try {
				const [songsData, statsData] = await Promise.all([
					fetchApi<{ songs: Song[] }>(
						`/songs?sort=${state.sortField}&direction=${state.sortDirection}`
					),
					fetchApi<{ stats: LibraryStats }>('/library/stats'),
				]);
				state.songs = songsData.songs;
				state.stats = statsData.stats;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load library';
			}
			state.isLoading = false;
		},

		async toggleFavorite(id: string) {
			const data = await fetchApi<{ song: Song }>(`/songs/${id}/favorite`, {
				method: 'PUT',
			});
			state.songs = state.songs.map((s) => (s.id === id ? data.song : s));
			return data.song;
		},

		async incrementPlayCount(id: string) {
			const data = await fetchApi<{ song: Song }>(`/songs/${id}/play`, {
				method: 'PUT',
			});
			state.songs = state.songs.map((s) => (s.id === id ? data.song : s));
			return data.song;
		},

		async searchSongs(query: string) {
			const data = await fetchApi<{ songs: Song[] }>(
				`/songs/search?q=${encodeURIComponent(query)}`
			);
			return data.songs;
		},

		async deleteSong(id: string) {
			await fetchApi(`/songs/${id}`, { method: 'DELETE' });
			state.songs = state.songs.filter((s) => s.id !== id);
		},

		setActiveTab(tab: 'songs' | 'albums' | 'artists' | 'genres') {
			state.activeTab = tab;
			if (tab === 'songs' && state.songs.length === 0) {
				this.loadSongs();
			} else if (tab === 'albums' && state.albums.length === 0) {
				this.loadAlbums();
			} else if (tab === 'artists' && state.artists.length === 0) {
				this.loadArtists();
			} else if (tab === 'genres' && state.genres.length === 0) {
				this.loadGenres();
			}
		},

		async setSortField(field: SortField) {
			state.sortField = field;
			await this.loadSongs();
		},

		async setSortDirection(direction: SortDirection) {
			state.sortDirection = direction;
			await this.loadSongs();
		},

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

			state.songs = [uploadData.song, ...state.songs];
			return uploadData.song;
		},

		async updateSongMetadata(id: string, data: Partial<Song>) {
			const result = await fetchApi<{ song: Song }>(`/songs/${id}`, {
				method: 'PUT',
				body: JSON.stringify(data),
			});
			state.songs = state.songs.map((s) => (s.id === id ? result.song : s));
			return result.song;
		},

		async extractMetadata(id: string) {
			const result = await fetchApi<{ song: Song }>(`/songs/${id}/extract-metadata`, {
				method: 'POST',
			});
			state.songs = state.songs.map((s) => (s.id === id ? result.song : s));
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
