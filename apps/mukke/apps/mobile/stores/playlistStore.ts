import { create } from 'zustand';

import type { Playlist } from '~/types';
import * as playlistService from '~/services/playlistService';

interface PlaylistState {
	playlists: Playlist[];
	isLoading: boolean;

	loadPlaylists: () => Promise<void>;
	createPlaylist: (name: string, description?: string) => Promise<Playlist>;
	deletePlaylist: (id: string) => Promise<void>;
	updatePlaylist: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
	playlists: [],
	isLoading: false,

	loadPlaylists: async () => {
		set({ isLoading: true });
		try {
			const playlists = await playlistService.getAllPlaylists();
			set({ playlists });
		} finally {
			set({ isLoading: false });
		}
	},

	createPlaylist: async (name, description) => {
		const playlist = await playlistService.createPlaylist(name, description);
		set((state) => ({ playlists: [playlist, ...state.playlists] }));
		return playlist;
	},

	deletePlaylist: async (id) => {
		await playlistService.deletePlaylist(id);
		set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
	},

	updatePlaylist: async (id, updates) => {
		await playlistService.updatePlaylist(id, updates);
		await get().loadPlaylists();
	},
}));
