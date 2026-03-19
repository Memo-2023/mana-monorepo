import { create } from 'zustand';

import type { RepeatMode, ShuffleMode, Song } from '~/types';
import {
	createQueue,
	getNextIndex,
	getPreviousIndex,
	shuffleQueue,
	unshuffleQueue,
	type QueueState,
} from '~/services/queueService';

interface PlayerState {
	currentSong: Song | null;
	isPlaying: boolean;
	position: number;
	duration: number;
	repeatMode: RepeatMode;
	shuffleMode: ShuffleMode;
	queueState: QueueState;

	playSong: (song: Song, queue?: Song[], startIndex?: number) => void;
	setPlaying: (playing: boolean) => void;
	setPosition: (position: number) => void;
	setDuration: (duration: number) => void;
	toggleRepeat: () => void;
	toggleShuffle: () => void;
	nextSong: () => Song | null;
	previousSong: () => Song | null;
	getQueue: () => Song[];
	clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
	currentSong: null,
	isPlaying: false,
	position: 0,
	duration: 0,
	repeatMode: 'off',
	shuffleMode: 'off',
	queueState: { queue: [], originalQueue: [], currentIndex: 0 },

	playSong: (song, queue, startIndex) => {
		let queueState: QueueState;
		if (queue && queue.length > 0) {
			const idx = startIndex ?? queue.findIndex((s) => s.id === song.id);
			queueState = createQueue(queue, Math.max(0, idx));
			if (get().shuffleMode === 'on') {
				queueState = shuffleQueue(queueState);
			}
		} else {
			queueState = createQueue([song], 0);
		}
		set({ currentSong: song, isPlaying: true, position: 0, duration: 0, queueState });
	},

	setPlaying: (playing) => set({ isPlaying: playing }),
	setPosition: (position) => set({ position }),
	setDuration: (duration) => set({ duration }),

	toggleRepeat: () => {
		const modes: RepeatMode[] = ['off', 'all', 'one'];
		const current = modes.indexOf(get().repeatMode);
		set({ repeatMode: modes[(current + 1) % modes.length] });
	},

	toggleShuffle: () => {
		const { shuffleMode, queueState } = get();
		if (shuffleMode === 'off') {
			set({
				shuffleMode: 'on',
				queueState: shuffleQueue(queueState),
			});
		} else {
			set({
				shuffleMode: 'off',
				queueState: unshuffleQueue(queueState),
			});
		}
	},

	nextSong: () => {
		const { queueState, repeatMode } = get();
		const nextIdx = getNextIndex(queueState, repeatMode);
		if (nextIdx === null) {
			set({ isPlaying: false });
			return null;
		}
		const song = queueState.queue[nextIdx];
		set({
			currentSong: song,
			position: 0,
			duration: 0,
			isPlaying: true,
			queueState: { ...queueState, currentIndex: nextIdx },
		});
		return song;
	},

	previousSong: () => {
		const { queueState, repeatMode, position } = get();
		// If more than 3 seconds in, restart current song
		if (position > 3) {
			set({ position: 0 });
			return get().currentSong;
		}
		const prevIdx = getPreviousIndex(queueState, repeatMode);
		if (prevIdx === null) {
			set({ position: 0 });
			return get().currentSong;
		}
		const song = queueState.queue[prevIdx];
		set({
			currentSong: song,
			position: 0,
			duration: 0,
			isPlaying: true,
			queueState: { ...queueState, currentIndex: prevIdx },
		});
		return song;
	},

	getQueue: () => get().queueState.queue,

	clearQueue: () => {
		set({
			currentSong: null,
			isPlaying: false,
			position: 0,
			duration: 0,
			queueState: { queue: [], originalQueue: [], currentIndex: 0 },
		});
	},
}));
