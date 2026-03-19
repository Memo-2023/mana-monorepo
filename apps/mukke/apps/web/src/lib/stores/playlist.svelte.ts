import type { Playlist, PlaylistWithSongs } from '@mukke/shared';
import { authStore } from './auth.svelte';

interface PlaylistState {
	playlists: Playlist[];
	currentPlaylist: PlaylistWithSongs | null;
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

function createPlaylistStore() {
	let state = $state<PlaylistState>({
		playlists: [],
		currentPlaylist: null,
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
		get playlists() {
			return state.playlists;
		},
		get currentPlaylist() {
			return state.currentPlaylist;
		},
		get isLoading() {
			return state.isLoading;
		},
		get error() {
			return state.error;
		},

		async loadPlaylists() {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ playlists: Playlist[] }>('/playlists');
				state.playlists = data.playlists;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load playlists';
			}
			state.isLoading = false;
		},

		async loadPlaylist(id: string) {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ playlist: PlaylistWithSongs }>(`/playlists/${id}`);
				state.currentPlaylist = data.playlist;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load playlist';
			}
			state.isLoading = false;
		},

		async createPlaylist(name: string, description?: string) {
			const data = await fetchApi<{ playlist: Playlist }>('/playlists', {
				method: 'POST',
				body: JSON.stringify({ name, description }),
			});
			state.playlists = [data.playlist, ...state.playlists];
			return data.playlist;
		},

		async updatePlaylist(id: string, updates: { name?: string; description?: string }) {
			const data = await fetchApi<{ playlist: Playlist }>(`/playlists/${id}`, {
				method: 'PUT',
				body: JSON.stringify(updates),
			});
			state.playlists = state.playlists.map((p) => (p.id === id ? data.playlist : p));
			if (state.currentPlaylist?.id === id) {
				state.currentPlaylist = { ...state.currentPlaylist, ...data.playlist };
			}
			return data.playlist;
		},

		async deletePlaylist(id: string) {
			await fetchApi(`/playlists/${id}`, { method: 'DELETE' });
			state.playlists = state.playlists.filter((p) => p.id !== id);
			if (state.currentPlaylist?.id === id) {
				state.currentPlaylist = null;
			}
		},

		async addSong(playlistId: string, songId: string) {
			const data = await fetchApi<{ playlist: PlaylistWithSongs }>(
				`/playlists/${playlistId}/songs`,
				{
					method: 'POST',
					body: JSON.stringify({ songId }),
				}
			);
			if (state.currentPlaylist?.id === playlistId) {
				state.currentPlaylist = data.playlist;
			}
			return data.playlist;
		},

		async removeSong(playlistId: string, songId: string) {
			const data = await fetchApi<{ playlist: PlaylistWithSongs }>(
				`/playlists/${playlistId}/songs/${songId}`,
				{ method: 'DELETE' }
			);
			if (state.currentPlaylist?.id === playlistId) {
				state.currentPlaylist = data.playlist;
			}
			return data.playlist;
		},

		async reorderSongs(playlistId: string, songIds: string[]) {
			const data = await fetchApi<{ playlist: PlaylistWithSongs }>(
				`/playlists/${playlistId}/songs/reorder`,
				{
					method: 'PUT',
					body: JSON.stringify({ songIds }),
				}
			);
			if (state.currentPlaylist?.id === playlistId) {
				state.currentPlaylist = data.playlist;
			}
			return data.playlist;
		},
	};
}

export const playlistStore = createPlaylistStore();
