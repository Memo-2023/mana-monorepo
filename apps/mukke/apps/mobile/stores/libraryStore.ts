import { create } from 'zustand';

import type { Album, Artist, Genre, LibraryTab, Song, SortDirection, SortField } from '~/types';
import * as libraryService from '~/services/libraryService';

interface LibraryState {
	songs: Song[];
	albums: Album[];
	artists: Artist[];
	genres: Genre[];
	activeTab: LibraryTab;
	sortField: SortField;
	sortDirection: SortDirection;
	isLoading: boolean;
	songCount: number;

	setActiveTab: (tab: LibraryTab) => void;
	setSortField: (field: SortField) => void;
	setSortDirection: (dir: SortDirection) => void;
	loadSongs: () => Promise<void>;
	loadAlbums: () => Promise<void>;
	loadArtists: () => Promise<void>;
	loadGenres: () => Promise<void>;
	loadAll: () => Promise<void>;
	toggleFavorite: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
	songs: [],
	albums: [],
	artists: [],
	genres: [],
	activeTab: 'songs',
	sortField: 'title',
	sortDirection: 'asc',
	isLoading: false,
	songCount: 0,

	setActiveTab: (tab) => set({ activeTab: tab }),

	setSortField: (field) => {
		set({ sortField: field });
		get().loadSongs();
	},

	setSortDirection: (dir) => {
		set({ sortDirection: dir });
		get().loadSongs();
	},

	loadSongs: async () => {
		const { sortField, sortDirection } = get();
		const songs = await libraryService.getAllSongs(
			sortField,
			sortDirection.toUpperCase() as 'ASC' | 'DESC'
		);
		set({ songs, songCount: songs.length });
	},

	loadAlbums: async () => {
		const albums = await libraryService.getAlbums();
		set({ albums });
	},

	loadArtists: async () => {
		const artists = await libraryService.getArtists();
		set({ artists });
	},

	loadGenres: async () => {
		const genres = await libraryService.getGenres();
		set({ genres });
	},

	loadAll: async () => {
		set({ isLoading: true });
		try {
			await Promise.all([
				get().loadSongs(),
				get().loadAlbums(),
				get().loadArtists(),
				get().loadGenres(),
			]);
		} finally {
			set({ isLoading: false });
		}
	},

	toggleFavorite: async (id) => {
		const newFav = await libraryService.toggleFavorite(id);
		set((state) => ({
			songs: state.songs.map((s) => (s.id === id ? { ...s, favorite: newFav } : s)),
		}));
	},
}));
