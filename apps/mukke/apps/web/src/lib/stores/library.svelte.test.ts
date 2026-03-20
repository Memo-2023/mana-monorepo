import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth store
vi.mock('./auth.svelte', () => ({
	authStore: {
		getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: 'Bearer test-token' }),
	},
}));

let libraryStore: typeof import('./library.svelte').libraryStore;

beforeEach(async () => {
	vi.clearAllMocks();
	vi.resetModules();
	const mod = await import('./library.svelte');
	libraryStore = mod.libraryStore;
});

function mockFetchResponse(data: unknown) {
	(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
		ok: true,
		json: () => Promise.resolve(data),
	});
}

function mockFetchError(message = 'Request failed') {
	(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
		ok: false,
		json: () => Promise.resolve({ message }),
	});
}

describe('libraryStore', () => {
	describe('initial state', () => {
		it('starts empty', () => {
			expect(libraryStore.songs).toEqual([]);
			expect(libraryStore.albums).toEqual([]);
			expect(libraryStore.artists).toEqual([]);
			expect(libraryStore.genres).toEqual([]);
			expect(libraryStore.stats).toBeNull();
			expect(libraryStore.activeTab).toBe('songs');
			expect(libraryStore.isLoading).toBe(false);
			expect(libraryStore.error).toBeNull();
		});
	});

	describe('loadSongs', () => {
		it('fetches songs and sets state', async () => {
			const songs = [
				{ id: '1', title: 'Song 1', coverArtPath: null },
				{ id: '2', title: 'Song 2', coverArtPath: null },
			];
			mockFetchResponse({ songs });

			await libraryStore.loadSongs();

			expect(libraryStore.songs).toEqual(songs);
			expect(libraryStore.isLoading).toBe(false);
			expect(libraryStore.error).toBeNull();
		});

		it('sets error on failure', async () => {
			mockFetchError('Server error');

			await libraryStore.loadSongs();

			expect(libraryStore.songs).toEqual([]);
			expect(libraryStore.error).toBe('Server error');
			expect(libraryStore.isLoading).toBe(false);
		});

		it('loads cover URLs for songs with cover art', async () => {
			const songs = [
				{ id: '1', title: 'Song 1', coverArtPath: 'users/test/covers/1.jpg' },
				{ id: '2', title: 'Song 2', coverArtPath: null },
			];
			mockFetchResponse({ songs });
			// Cover URLs fetch
			mockFetchResponse({ urls: { 'users/test/covers/1.jpg': 'https://minio.test/cover.jpg' } });

			await libraryStore.loadSongs();

			// Wait for cover URLs to load (async, non-blocking)
			await vi.waitFor(() => {
				expect(libraryStore.coverUrls['users/test/covers/1.jpg']).toBe(
					'https://minio.test/cover.jpg'
				);
			});
		});
	});

	describe('loadCoverUrls', () => {
		it('filters out non-image paths', async () => {
			// Should not make any fetch for .mp3 paths
			await libraryStore.loadCoverUrls(['users/test/song.mp3', 'users/test/audio.wav']);

			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('loads valid image paths', async () => {
			mockFetchResponse({
				urls: { 'users/test/covers/1.jpg': 'https://minio.test/cover.jpg' },
			});

			await libraryStore.loadCoverUrls(['users/test/covers/1.jpg']);

			expect(libraryStore.coverUrls['users/test/covers/1.jpg']).toBe(
				'https://minio.test/cover.jpg'
			);
		});

		it('does not refetch cached URLs', async () => {
			mockFetchResponse({
				urls: { 'users/test/covers/1.jpg': 'https://minio.test/cover.jpg' },
			});
			await libraryStore.loadCoverUrls(['users/test/covers/1.jpg']);

			// Second call with same path should not fetch
			await libraryStore.loadCoverUrls(['users/test/covers/1.jpg']);

			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('silently handles errors', async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

			await libraryStore.loadCoverUrls(['users/test/covers/1.png']);

			// Should not throw or set error
			expect(libraryStore.error).toBeNull();
		});

		it('accepts various image extensions', async () => {
			const paths = [
				'covers/1.jpg',
				'covers/2.jpeg',
				'covers/3.png',
				'covers/4.webp',
				'covers/5.gif',
				'covers/6.avif',
				'covers/7.svg',
			];
			const urls: Record<string, string> = {};
			paths.forEach((p) => (urls[p] = `https://minio.test/${p}`));
			mockFetchResponse({ urls });

			await libraryStore.loadCoverUrls(paths);

			expect(global.fetch).toHaveBeenCalledTimes(1);
			paths.forEach((p) => {
				expect(libraryStore.coverUrls[p]).toBe(`https://minio.test/${p}`);
			});
		});
	});

	describe('loadAlbums', () => {
		it('fetches albums and sets state', async () => {
			const albums = [{ album: 'Album 1', songCount: 5, coverArtPath: null }];
			mockFetchResponse({ albums });

			await libraryStore.loadAlbums();

			expect(libraryStore.albums).toEqual(albums);
		});
	});

	describe('loadArtists', () => {
		it('fetches artists and sets state', async () => {
			const artists = [{ artist: 'Artist 1', songCount: 3, albumCount: 1 }];
			mockFetchResponse({ artists });

			await libraryStore.loadArtists();

			expect(libraryStore.artists).toEqual(artists);
		});
	});

	describe('loadGenres', () => {
		it('fetches genres and sets state', async () => {
			const genres = [{ genre: 'Rock', songCount: 10 }];
			mockFetchResponse({ genres });

			await libraryStore.loadGenres();

			expect(libraryStore.genres).toEqual(genres);
		});
	});

	describe('loadStats', () => {
		it('fetches stats and sets state', async () => {
			const stats = { totalSongs: 50, totalArtists: 10, totalAlbums: 5, totalGenres: 3 };
			mockFetchResponse({ stats });

			await libraryStore.loadStats();

			expect(libraryStore.stats).toEqual(stats);
		});
	});

	describe('toggleFavorite', () => {
		it('updates song in list', async () => {
			const songs = [{ id: '1', title: 'Song 1', favorite: false, coverArtPath: null }];
			mockFetchResponse({ songs });
			await libraryStore.loadSongs();

			mockFetchResponse({ song: { ...songs[0], favorite: true } });
			await libraryStore.toggleFavorite('1');

			expect(libraryStore.songs[0].favorite).toBe(true);
		});
	});

	describe('setActiveTab', () => {
		it('changes active tab', () => {
			expect(libraryStore.activeTab).toBe('songs');
			libraryStore.setActiveTab('albums');
			expect(libraryStore.activeTab).toBe('albums');
		});

		it('triggers load for empty tabs', async () => {
			mockFetchResponse({ albums: [] });
			libraryStore.setActiveTab('albums');

			// setActiveTab triggers an async load internally
			await vi.waitFor(() => {
				expect(global.fetch).toHaveBeenCalled();
			});
			expect(libraryStore.activeTab).toBe('albums');
		});
	});

	describe('uploadSong', () => {
		it('creates song and uploads file', async () => {
			const song = { id: '1', title: 'New Song' };
			mockFetchResponse({ song, uploadUrl: 'https://minio.test/upload' });
			// Upload PUT
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

			const file = new File(['audio data'], 'song.mp3', { type: 'audio/mpeg' });
			const result = await libraryStore.uploadSong(file);

			expect(result).toEqual(song);
			expect(libraryStore.songs).toContainEqual(song);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	describe('deleteSong', () => {
		it('removes song from list', async () => {
			const songs = [
				{ id: '1', title: 'Song 1', coverArtPath: null },
				{ id: '2', title: 'Song 2', coverArtPath: null },
			];
			mockFetchResponse({ songs });
			await libraryStore.loadSongs();

			mockFetchResponse({});
			await libraryStore.deleteSong('1');

			expect(libraryStore.songs).toHaveLength(1);
			expect(libraryStore.songs[0].id).toBe('2');
		});
	});
});
