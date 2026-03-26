import type { StorageFile } from '$lib/api/client';
import { authStore } from '$lib/stores/auth.svelte';
import { browser } from '$app/environment';

export interface AudioFile {
	id: string;
	name: string;
	mimeType: string;
	size: number;
}

function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		if (injected) return injected;
	}
	return 'http://localhost:3016';
}

function createAudioPlayerStore() {
	let state = $state({
		currentFile: null as AudioFile | null,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 1,
		queue: [] as AudioFile[],
		currentIndex: 0,
		showFullPlayer: false,
		error: null as string | null,
	});

	let audio: HTMLAudioElement | null = null;

	if (browser) {
		audio = new Audio();
		audio.crossOrigin = 'anonymous';
		audio.addEventListener('timeupdate', () => {
			state.currentTime = audio!.currentTime;
		});
		audio.addEventListener('loadedmetadata', () => {
			state.duration = audio!.duration;
		});
		audio.addEventListener('ended', () => {
			handleNext();
		});
		audio.addEventListener('error', () => {
			const mediaError = audio!.error;
			const msg =
				mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
					? 'Audioformat wird nicht unterstützt'
					: mediaError?.code === MediaError.MEDIA_ERR_NETWORK
						? 'Netzwerkfehler beim Laden'
						: 'Audiodatei konnte nicht geladen werden';
			state.error = msg;
			state.isPlaying = false;
		});
	}

	async function getDownloadUrl(fileId: string): Promise<string> {
		const token = await authStore.getAccessToken();
		const res = await fetch(`${getBackendUrl()}/api/v1/files/${fileId}/download?url=true`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) throw new Error('Failed to get download URL');
		const data = await res.json();
		return data.url;
	}

	function updateMediaSession(file: AudioFile) {
		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: file.name,
			});
			navigator.mediaSession.setActionHandler('play', () => store.togglePlay());
			navigator.mediaSession.setActionHandler('pause', () => store.togglePlay());
			navigator.mediaSession.setActionHandler('nexttrack', () => store.nextTrack());
			navigator.mediaSession.setActionHandler('previoustrack', () => store.previousTrack());
		}
	}

	async function loadAndPlay(file: AudioFile) {
		if (!audio) return;

		state.currentFile = file;
		state.currentTime = 0;
		state.duration = 0;
		state.error = null;

		try {
			const url = await getDownloadUrl(file.id);
			audio.src = url;
			await audio.play();
			state.isPlaying = true;
			updateMediaSession(file);
		} catch (e) {
			console.warn(`[Storage Player] Failed to play "${file.name}":`, e);
			state.isPlaying = false;
			if (!state.error) {
				state.error = 'Datei konnte nicht abgespielt werden.';
			}
		}
	}

	function handleNext() {
		if (state.queue.length === 0) {
			state.isPlaying = false;
			return;
		}

		if (state.currentIndex < state.queue.length - 1) {
			state.currentIndex++;
			loadAndPlay(state.queue[state.currentIndex]);
		} else {
			state.isPlaying = false;
			if (audio) audio.pause();
		}
	}

	const store = {
		get currentFile() {
			return state.currentFile;
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
		get queue() {
			return state.queue;
		},
		get currentIndex() {
			return state.currentIndex;
		},
		get showFullPlayer() {
			return state.showFullPlayer;
		},
		get error() {
			return state.error;
		},

		async playFile(file: AudioFile, queue?: AudioFile[], startIndex?: number) {
			if (queue) {
				state.queue = [...queue];
				state.currentIndex = startIndex ?? 0;
			} else {
				state.queue = [file];
				state.currentIndex = 0;
			}
			await loadAndPlay(file);
		},

		togglePlay() {
			if (!audio || !state.currentFile) return;
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

		nextTrack() {
			handleNext();
		},

		previousTrack() {
			if (state.currentTime > 3) {
				store.seekTo(0);
				return;
			}
			if (state.currentIndex > 0) {
				state.currentIndex--;
				loadAndPlay(state.queue[state.currentIndex]);
			}
		},

		toggleFullPlayer() {
			state.showFullPlayer = !state.showFullPlayer;
		},

		clearError() {
			state.error = null;
		},

		stop() {
			if (audio) {
				audio.pause();
				audio.src = '';
			}
			state.currentFile = null;
			state.isPlaying = false;
			state.currentTime = 0;
			state.duration = 0;
			state.queue = [];
			state.currentIndex = 0;
			state.showFullPlayer = false;
			state.error = null;
		},

		getAudioElement(): HTMLAudioElement | null {
			return audio;
		},
	};

	return store;
}

export const audioPlayerStore = createAudioPlayerStore();

/** Extract audio files from a list of StorageFiles */
export function getAudioFiles(files: StorageFile[]): AudioFile[] {
	return files
		.filter((f) => f.mimeType.startsWith('audio/'))
		.map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType, size: f.size }));
}
