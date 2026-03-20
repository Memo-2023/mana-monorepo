import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth store before importing player store
vi.mock('./auth.svelte', () => ({
	authStore: {
		getAuthHeaders: vi.fn().mockResolvedValue({ Authorization: 'Bearer test-token' }),
	},
}));

// Dynamic import to allow mock setup first
let playerStore: typeof import('./player.svelte').playerStore;

beforeEach(async () => {
	vi.clearAllMocks();

	// Reset module registry so each test gets a fresh store
	vi.resetModules();
	const mod = await import('./player.svelte');
	playerStore = mod.playerStore;
});

function makeSong(overrides: Partial<{ id: string; title: string; artist: string }> = {}) {
	return {
		id: overrides.id ?? '1',
		title: overrides.title ?? 'Test Song',
		artist: overrides.artist ?? 'Test Artist',
		album: null,
		albumArtist: null,
		genre: null,
		trackNumber: null,
		year: null,
		duration: 180,
		storagePath: 'users/test/1.mp3',
		coverArtPath: null,
		fileSize: null,
		bpm: null,
		favorite: false,
		playCount: 0,
		lastPlayedAt: null,
		addedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		userId: 'user-1',
	} as any;
}

describe('playerStore', () => {
	describe('initial state', () => {
		it('starts with no song playing', () => {
			expect(playerStore.currentSong).toBeNull();
			expect(playerStore.isPlaying).toBe(false);
			expect(playerStore.currentTime).toBe(0);
			expect(playerStore.duration).toBe(0);
			expect(playerStore.error).toBeNull();
		});

		it('starts with default settings', () => {
			expect(playerStore.volume).toBe(1);
			expect(playerStore.repeatMode).toBe('off');
			expect(playerStore.shuffleOn).toBe(false);
			expect(playerStore.queue).toEqual([]);
			expect(playerStore.showFullPlayer).toBe(false);
			expect(playerStore.showQueue).toBe(false);
		});
	});

	describe('playSong', () => {
		it('sets current song and fetches download URL', async () => {
			const song = makeSong();
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song.mp3' }),
			});

			await playerStore.playSong(song);

			expect(playerStore.currentSong).toEqual(song);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/songs/1/download-url'),
				expect.any(Object)
			);
		});

		it('sets up queue when provided', async () => {
			const songs = [makeSong({ id: '1' }), makeSong({ id: '2' }), makeSong({ id: '3' })];
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song.mp3' }),
			});

			await playerStore.playSong(songs[1], songs, 1);

			expect(playerStore.currentSong?.id).toBe('2');
			expect(playerStore.queue).toHaveLength(3);
			expect(playerStore.currentIndex).toBe(1);
		});

		it('sets error when download URL fetch fails', async () => {
			const song = makeSong();
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ message: 'Not found' }),
			});

			await playerStore.playSong(song);

			expect(playerStore.isPlaying).toBe(false);
			expect(playerStore.error).toBeTruthy();
		});
	});

	describe('togglePlay', () => {
		it('does nothing when no song is loaded', () => {
			playerStore.togglePlay();
			expect(playerStore.isPlaying).toBe(false);
		});
	});

	describe('toggleRepeat', () => {
		it('cycles through off -> all -> one -> off', () => {
			expect(playerStore.repeatMode).toBe('off');

			playerStore.toggleRepeat();
			expect(playerStore.repeatMode).toBe('all');

			playerStore.toggleRepeat();
			expect(playerStore.repeatMode).toBe('one');

			playerStore.toggleRepeat();
			expect(playerStore.repeatMode).toBe('off');
		});
	});

	describe('toggleShuffle', () => {
		it('toggles shuffle state', () => {
			expect(playerStore.shuffleOn).toBe(false);
			playerStore.toggleShuffle();
			expect(playerStore.shuffleOn).toBe(true);
			playerStore.toggleShuffle();
			expect(playerStore.shuffleOn).toBe(false);
		});
	});

	describe('toggleFullPlayer', () => {
		it('toggles full player visibility', () => {
			expect(playerStore.showFullPlayer).toBe(false);
			playerStore.toggleFullPlayer();
			expect(playerStore.showFullPlayer).toBe(true);
			playerStore.toggleFullPlayer();
			expect(playerStore.showFullPlayer).toBe(false);
		});
	});

	describe('toggleQueue', () => {
		it('toggles queue panel visibility', () => {
			expect(playerStore.showQueue).toBe(false);
			playerStore.toggleQueue();
			expect(playerStore.showQueue).toBe(true);
			playerStore.toggleQueue();
			expect(playerStore.showQueue).toBe(false);
		});
	});

	describe('error handling', () => {
		it('clearError resets error state', async () => {
			const song = makeSong();
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ message: 'Not found' }),
			});

			await playerStore.playSong(song);
			expect(playerStore.error).toBeTruthy();

			playerStore.clearError();
			expect(playerStore.error).toBeNull();
		});
	});

	describe('clearQueue', () => {
		it('resets all state', async () => {
			const song = makeSong();
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song.mp3' }),
			});

			await playerStore.playSong(song, [song], 0);
			playerStore.clearQueue();

			expect(playerStore.currentSong).toBeNull();
			expect(playerStore.isPlaying).toBe(false);
			expect(playerStore.queue).toEqual([]);
			expect(playerStore.error).toBeNull();
			expect(playerStore.showFullPlayer).toBe(false);
			expect(playerStore.showQueue).toBe(false);
		});
	});

	describe('playQueue', () => {
		it('starts playing from given index', async () => {
			const songs = [makeSong({ id: '1' }), makeSong({ id: '2' }), makeSong({ id: '3' })];
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song2.mp3' }),
			});

			await playerStore.playQueue(songs, 1);

			expect(playerStore.currentSong?.id).toBe('2');
			expect(playerStore.queue).toHaveLength(3);
		});
	});

	describe('setVolume', () => {
		it('clamps volume between 0 and 1', () => {
			playerStore.setVolume(0.5);
			expect(playerStore.volume).toBe(0.5);

			playerStore.setVolume(-1);
			expect(playerStore.volume).toBe(0);

			playerStore.setVolume(2);
			expect(playerStore.volume).toBe(1);
		});
	});

	describe('removeFromQueue', () => {
		it('does not remove current song', async () => {
			const songs = [makeSong({ id: '1' }), makeSong({ id: '2' })];
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song.mp3' }),
			});

			await playerStore.playSong(songs[0], songs, 0);
			playerStore.removeFromQueue(0);

			expect(playerStore.queue).toHaveLength(2);
		});

		it('removes non-current song from queue', async () => {
			const songs = [makeSong({ id: '1' }), makeSong({ id: '2' }), makeSong({ id: '3' })];
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ url: 'https://minio.test/song.mp3' }),
			});

			await playerStore.playSong(songs[0], songs, 0);
			playerStore.removeFromQueue(2);

			expect(playerStore.queue).toHaveLength(2);
		});
	});
});
