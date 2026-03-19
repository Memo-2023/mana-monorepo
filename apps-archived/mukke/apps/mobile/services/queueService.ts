import type { Song } from '~/types';

export interface QueueState {
	queue: Song[];
	originalQueue: Song[];
	currentIndex: number;
}

export function createQueue(songs: Song[], startIndex: number = 0): QueueState {
	return {
		queue: [...songs],
		originalQueue: [...songs],
		currentIndex: startIndex,
	};
}

export function shuffleQueue(state: QueueState): QueueState {
	const currentSong = state.queue[state.currentIndex];
	const remaining = state.queue.filter((_, i) => i !== state.currentIndex);

	// Fisher-Yates shuffle
	for (let i = remaining.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[remaining[i], remaining[j]] = [remaining[j], remaining[i]];
	}

	return {
		...state,
		queue: currentSong ? [currentSong, ...remaining] : remaining,
		currentIndex: 0,
	};
}

export function unshuffleQueue(state: QueueState): QueueState {
	const currentSong = state.queue[state.currentIndex];
	const newIndex = currentSong ? state.originalQueue.findIndex((s) => s.id === currentSong.id) : 0;

	return {
		...state,
		queue: [...state.originalQueue],
		currentIndex: Math.max(0, newIndex),
	};
}

export function getNextIndex(state: QueueState, repeatMode: 'off' | 'all' | 'one'): number | null {
	if (repeatMode === 'one') return state.currentIndex;
	if (state.currentIndex < state.queue.length - 1) return state.currentIndex + 1;
	if (repeatMode === 'all') return 0;
	return null;
}

export function getPreviousIndex(
	state: QueueState,
	repeatMode: 'off' | 'all' | 'one'
): number | null {
	if (repeatMode === 'one') return state.currentIndex;
	if (state.currentIndex > 0) return state.currentIndex - 1;
	if (repeatMode === 'all') return state.queue.length - 1;
	return null;
}
