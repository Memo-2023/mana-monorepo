import type { Song } from '@mukke/shared';
import { authStore } from './auth.svelte';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
	currentSong: Song | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	repeatMode: RepeatMode;
	shuffleOn: boolean;
	queue: Song[];
	originalQueue: Song[];
	currentIndex: number;
	showFullPlayer: boolean;
	showQueue: boolean;
}

function getBackendUrl(): string {
	let baseUrl = 'http://localhost:3010';
	if (typeof window !== 'undefined') {
		baseUrl =
			(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__ ||
			'http://localhost:3010';
	}
	return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
}

function shuffleArray<T>(arr: T[], keepIndex: number): T[] {
	const result = [...arr];
	// Fisher-Yates shuffle, keeping the item at keepIndex at position 0
	if (keepIndex >= 0 && keepIndex < result.length) {
		[result[0], result[keepIndex]] = [result[keepIndex], result[0]];
	}
	for (let i = result.length - 1; i > 1; i--) {
		const j = 1 + Math.floor(Math.random() * i);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function createPlayerStore() {
	let state = $state<PlayerState>({
		currentSong: null,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 1,
		repeatMode: 'off',
		shuffleOn: false,
		queue: [],
		originalQueue: [],
		currentIndex: 0,
		showFullPlayer: false,
		showQueue: false,
	});

	let audio: HTMLAudioElement | null = null;

	if (typeof window !== 'undefined') {
		audio = new Audio();
		audio.addEventListener('timeupdate', () => {
			state.currentTime = audio!.currentTime;
		});
		audio.addEventListener('loadedmetadata', () => {
			state.duration = audio!.duration;
		});
		audio.addEventListener('ended', () => {
			handleNext();
		});
	}

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${getBackendUrl()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...authStore.getAuthHeaders(),
				...options.headers,
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(error.message || 'Request failed');
		}

		return response.json();
	}

	async function getDownloadUrl(songId: string): Promise<string> {
		const data = await fetchApi<{ url: string }>(`/songs/${songId}/download-url`);
		return data.url;
	}

	function getNextIndex(): number | null {
		if (state.queue.length === 0) return null;

		if (state.repeatMode === 'one') {
			return state.currentIndex;
		}

		if (state.currentIndex < state.queue.length - 1) {
			return state.currentIndex + 1;
		}

		if (state.repeatMode === 'all') {
			return 0;
		}

		return null;
	}

	function getPreviousIndex(): number | null {
		if (state.queue.length === 0) return null;

		if (state.repeatMode === 'one') {
			return state.currentIndex;
		}

		if (state.currentIndex > 0) {
			return state.currentIndex - 1;
		}

		if (state.repeatMode === 'all') {
			return state.queue.length - 1;
		}

		return null;
	}

	function updateMediaSession(song: Song) {
		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: song.title,
				artist: song.artist || 'Unknown',
				album: song.album || '',
			});
			navigator.mediaSession.setActionHandler('play', () => store.togglePlay());
			navigator.mediaSession.setActionHandler('pause', () => store.togglePlay());
			navigator.mediaSession.setActionHandler('nexttrack', () => store.nextSong());
			navigator.mediaSession.setActionHandler('previoustrack', () => store.previousSong());
		}
	}

	async function loadAndPlay(song: Song) {
		if (!audio) return;

		state.currentSong = song;
		state.currentTime = 0;
		state.duration = 0;

		try {
			const url = await getDownloadUrl(song.id);
			audio.src = url;
			await audio.play();
			state.isPlaying = true;
			updateMediaSession(song);
		} catch (e) {
			console.error('Failed to play song:', e);
			state.isPlaying = false;
		}
	}

	function handleNext() {
		const nextIdx = getNextIndex();
		if (nextIdx !== null) {
			state.currentIndex = nextIdx;
			loadAndPlay(state.queue[nextIdx]);
		} else {
			state.isPlaying = false;
			if (audio) {
				audio.pause();
			}
		}
	}

	const store = {
		get currentSong() {
			return state.currentSong;
		},
		get isPlaying() {
			return state.isPlaying;
		},
		get currentTime() {
			return state.currentTime;
		},
		get duration() {
			return state.duration;
		},
		get volume() {
			return state.volume;
		},
		get repeatMode() {
			return state.repeatMode;
		},
		get shuffleOn() {
			return state.shuffleOn;
		},
		get queue() {
			return state.queue;
		},
		get originalQueue() {
			return state.originalQueue;
		},
		get currentIndex() {
			return state.currentIndex;
		},
		get showFullPlayer() {
			return state.showFullPlayer;
		},
		get showQueue() {
			return state.showQueue;
		},

		async playSong(song: Song, queue?: Song[], startIndex?: number) {
			if (queue) {
				state.originalQueue = [...queue];
				state.queue = [...queue];
				state.currentIndex = startIndex ?? 0;

				if (state.shuffleOn) {
					state.queue = shuffleArray(state.queue, state.currentIndex);
					state.currentIndex = 0;
				}
			}

			await loadAndPlay(song);
		},

		async playQueue(songs: Song[], startIndex: number) {
			state.originalQueue = [...songs];
			state.queue = [...songs];
			state.currentIndex = startIndex;

			if (state.shuffleOn) {
				state.queue = shuffleArray(state.queue, startIndex);
				state.currentIndex = 0;
			}

			await loadAndPlay(state.queue[state.currentIndex]);
		},

		togglePlay() {
			if (!audio || !state.currentSong) return;

			if (state.isPlaying) {
				audio.pause();
				state.isPlaying = false;
			} else {
				audio.play();
				state.isPlaying = true;
			}
		},

		seekTo(time: number) {
			if (!audio) return;
			audio.currentTime = time;
			state.currentTime = time;
		},

		setVolume(vol: number) {
			if (!audio) return;
			const clamped = Math.max(0, Math.min(1, vol));
			audio.volume = clamped;
			state.volume = clamped;
		},

		async nextSong() {
			handleNext();
		},

		async previousSong() {
			if (state.currentTime > 3) {
				store.seekTo(0);
				return;
			}

			const prevIdx = getPreviousIndex();
			if (prevIdx !== null) {
				state.currentIndex = prevIdx;
				await loadAndPlay(state.queue[prevIdx]);
			}
		},

		toggleShuffle() {
			state.shuffleOn = !state.shuffleOn;

			if (state.shuffleOn) {
				const currentSong = state.queue[state.currentIndex];
				state.queue = shuffleArray(state.queue, state.currentIndex);
				state.currentIndex = 0;
				// Verify current song is at 0
				if (state.queue[0]?.id !== currentSong?.id) {
					const idx = state.queue.findIndex((s) => s.id === currentSong?.id);
					if (idx >= 0) {
						[state.queue[0], state.queue[idx]] = [state.queue[idx], state.queue[0]];
					}
				}
			} else {
				const currentSong = state.queue[state.currentIndex];
				state.queue = [...state.originalQueue];
				const idx = state.queue.findIndex((s) => s.id === currentSong?.id);
				state.currentIndex = idx >= 0 ? idx : 0;
			}
		},

		toggleRepeat() {
			const modes: RepeatMode[] = ['off', 'all', 'one'];
			const currentIdx = modes.indexOf(state.repeatMode);
			state.repeatMode = modes[(currentIdx + 1) % modes.length];
		},

		toggleFullPlayer() {
			state.showFullPlayer = !state.showFullPlayer;
		},

		toggleQueue() {
			state.showQueue = !state.showQueue;
		},

		clearQueue() {
			if (audio) {
				audio.pause();
				audio.src = '';
			}
			state.currentSong = null;
			state.isPlaying = false;
			state.currentTime = 0;
			state.duration = 0;
			state.queue = [];
			state.originalQueue = [];
			state.currentIndex = 0;
			state.showFullPlayer = false;
			state.showQueue = false;
		},

		removeFromQueue(index: number) {
			if (index === state.currentIndex) return;

			state.queue = state.queue.filter((_, i) => i !== index);

			if (index < state.currentIndex) {
				state.currentIndex--;
			}
		},
	};

	return store;
}

export const playerStore = createPlayerStore();
