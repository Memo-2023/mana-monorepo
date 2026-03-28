/**
 * Playlist Store — Mutation + API Operations
 *
 * Reads for playlist lists are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store handles mutations that write to IndexedDB + backend.
 * The live queries will automatically pick up local changes.
 */

import type { Playlist, PlaylistWithSongs } from '@mukke/shared';
import { authStore } from './auth.svelte';
import {
	playlistCollection,
	playlistSongCollection,
	type LocalPlaylist,
	type LocalPlaylistSong,
} from '$lib/data/local-store';

interface PlaylistState {
	currentPlaylist: PlaylistWithSongs | null;
	coverUrls: Record<string, string>;
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
		currentPlaylist: null,
		coverUrls: {},
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
		get currentPlaylist() {
			return state.currentPlaylist;
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
			const uncached = paths.filter((p) => p && !state.coverUrls[p]);
			if (uncached.length === 0) return;
			try {
				const data = await fetchApi<{ urls: Record<string, string> }>('/library/cover-urls', {
					method: 'POST',
					body: JSON.stringify({ paths: uncached }),
				});
				state.coverUrls = { ...state.coverUrls, ...data.urls };
			} catch {
				// Cover URLs are non-critical
			}
		},

		/** Load a single playlist detail from backend. */
		async loadPlaylist(id: string) {
			state.isLoading = true;
			state.error = null;
			try {
				const data = await fetchApi<{ playlist: PlaylistWithSongs }>(`/playlists/${id}`);
				state.currentPlaylist = data.playlist;
				const coverPaths = data.playlist.songs
					.map((s) => s.coverArtPath)
					.filter((p): p is string => !!p);
				if (coverPaths.length > 0) this.loadCoverUrls(coverPaths);
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Failed to load playlist';
			}
			state.isLoading = false;
		},

		/** Create playlist — writes to IndexedDB + backend. */
		async createPlaylist(name: string, description?: string) {
			const newLocal: LocalPlaylist = {
				id: crypto.randomUUID(),
				name,
				description: description ?? null,
				coverArtPath: null,
			};
			await playlistCollection.insert(newLocal);

			// Also create on backend
			try {
				const data = await fetchApi<{ playlist: Playlist }>('/playlists', {
					method: 'POST',
					body: JSON.stringify({ name, description }),
				});
				return data.playlist;
			} catch {
				// Sync will reconcile
				return newLocal as unknown as Playlist;
			}
		},

		/** Update playlist — writes to IndexedDB + backend. */
		async updatePlaylist(id: string, updates: { name?: string; description?: string }) {
			const updateData: Partial<LocalPlaylist> = {};
			if (updates.name !== undefined) updateData.name = updates.name;
			if (updates.description !== undefined) updateData.description = updates.description ?? null;
			await playlistCollection.update(id, updateData);

			try {
				const data = await fetchApi<{ playlist: Playlist }>(`/playlists/${id}`, {
					method: 'PUT',
					body: JSON.stringify(updates),
				});
				if (state.currentPlaylist?.id === id) {
					state.currentPlaylist = { ...state.currentPlaylist, ...data.playlist };
				}
				return data.playlist;
			} catch {
				return updates as unknown as Playlist;
			}
		},

		/** Delete playlist — removes from IndexedDB + backend. */
		async deletePlaylist(id: string) {
			await playlistCollection.delete(id);
			// Also delete associated playlistSongs
			const allPS = await playlistSongCollection.getAll();
			for (const ps of allPS.filter((p) => p.playlistId === id)) {
				await playlistSongCollection.delete(ps.id);
			}

			if (state.currentPlaylist?.id === id) {
				state.currentPlaylist = null;
			}

			try {
				await fetchApi(`/playlists/${id}`, { method: 'DELETE' });
			} catch {
				// Sync will reconcile
			}
		},

		/** Add song to playlist — writes to IndexedDB + backend. */
		async addSong(playlistId: string, songId: string) {
			const allPS = await playlistSongCollection.getAll();
			const maxSort = allPS
				.filter((ps) => ps.playlistId === playlistId)
				.reduce((max, ps) => Math.max(max, ps.sortOrder), -1);

			const newPS: LocalPlaylistSong = {
				id: crypto.randomUUID(),
				playlistId,
				songId,
				sortOrder: maxSort + 1,
			};
			await playlistSongCollection.insert(newPS);

			try {
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
			} catch {
				return null;
			}
		},

		/** Remove song from playlist — removes from IndexedDB + backend. */
		async removeSong(playlistId: string, songId: string) {
			const allPS = await playlistSongCollection.getAll();
			const toRemove = allPS.find((ps) => ps.playlistId === playlistId && ps.songId === songId);
			if (toRemove) {
				await playlistSongCollection.delete(toRemove.id);
			}

			try {
				const data = await fetchApi<{ playlist: PlaylistWithSongs }>(
					`/playlists/${playlistId}/songs/${songId}`,
					{ method: 'DELETE' }
				);
				if (state.currentPlaylist?.id === playlistId) {
					state.currentPlaylist = data.playlist;
				}
				return data.playlist;
			} catch {
				return null;
			}
		},

		/** Reorder songs in playlist — updates IndexedDB + backend. */
		async reorderSongs(playlistId: string, songIds: string[]) {
			const allPS = await playlistSongCollection.getAll();
			const psForPlaylist = allPS.filter((ps) => ps.playlistId === playlistId);
			for (let i = 0; i < songIds.length; i++) {
				const ps = psForPlaylist.find((p) => p.songId === songIds[i]);
				if (ps) {
					await playlistSongCollection.update(ps.id, { sortOrder: i });
				}
			}

			try {
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
			} catch {
				return null;
			}
		},
	};
}

export const playlistStore = createPlaylistStore();
