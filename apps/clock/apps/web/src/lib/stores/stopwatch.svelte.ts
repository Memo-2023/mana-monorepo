/**
 * Multi-Stopwatch Store - Manages multiple stopwatches using Svelte 5 runes
 * Local-only with localStorage persistence
 */

import { browser } from '$app/environment';

export interface Lap {
	number: number;
	time: number; // milliseconds
	splitTime: number; // total time at lap
}

export interface Stopwatch {
	id: string;
	label: string;
	color: string;
	isRunning: boolean;
	elapsedTime: number; // milliseconds
	laps: Lap[];
	startTime: number | null;
	pausedTime: number;
	createdAt: Date;
}

// Available colors for stopwatches
export const STOPWATCH_COLORS = [
	'#f59e0b', // amber (primary)
	'#ef4444', // red
	'#22c55e', // green
	'#3b82f6', // blue
	'#8b5cf6', // violet
	'#ec4899', // pink
	'#06b6d4', // cyan
	'#f97316', // orange
] as const;

// Storage key
const STORAGE_KEY = 'clock-stopwatches';

// State
let stopwatches = $state<Stopwatch[]>([]);
let focusedId = $state<string | null>(null);

// Animation frames for each stopwatch
const animationFrames: Map<string, number> = new Map();

// Initialize from localStorage
function loadFromStorage(): Stopwatch[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.map((sw: any) => ({
				...sw,
				createdAt: new Date(sw.createdAt),
				isRunning: false, // Always start paused on page load
				startTime: null,
			}));
		}
	} catch (e) {
		console.error('Failed to load stopwatches from storage:', e);
	}
	return [];
}

function saveToStorage() {
	if (!browser) return;
	try {
		const toStore = stopwatches.map((sw) => ({
			...sw,
			isRunning: false, // Don't persist running state
			startTime: null,
		}));
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
	} catch (e) {
		console.error('Failed to save stopwatches to storage:', e);
	}
}

// Initialize
if (browser) {
	stopwatches = loadFromStorage();
	if (stopwatches.length > 0) {
		focusedId = stopwatches[0].id;
	}
}

function updateTime(id: string) {
	const sw = stopwatches.find((s) => s.id === id);
	if (sw && sw.isRunning && sw.startTime !== null) {
		const newElapsed = sw.pausedTime + (Date.now() - sw.startTime);
		stopwatches = stopwatches.map((s) => (s.id === id ? { ...s, elapsedTime: newElapsed } : s));
		animationFrames.set(
			id,
			requestAnimationFrame(() => updateTime(id))
		);
	}
}

function getNextColor(): string {
	const usedColors = stopwatches.map((sw) => sw.color);
	const availableColor = STOPWATCH_COLORS.find((c) => !usedColors.includes(c));
	return availableColor || STOPWATCH_COLORS[stopwatches.length % STOPWATCH_COLORS.length];
}

export const stopwatchesStore = {
	// Getters
	get stopwatches() {
		return stopwatches;
	},
	get focusedId() {
		return focusedId;
	},
	get focusedStopwatch() {
		return stopwatches.find((sw) => sw.id === focusedId) || null;
	},
	get runningCount() {
		return stopwatches.filter((sw) => sw.isRunning).length;
	},

	/**
	 * Create a new stopwatch
	 */
	create(label: string = ''): string {
		const id = crypto.randomUUID();
		const newStopwatch: Stopwatch = {
			id,
			label: label || `Stoppuhr ${stopwatches.length + 1}`,
			color: getNextColor(),
			isRunning: false,
			elapsedTime: 0,
			laps: [],
			startTime: null,
			pausedTime: 0,
			createdAt: new Date(),
		};
		stopwatches = [...stopwatches, newStopwatch];
		focusedId = id;
		saveToStorage();
		return id;
	},

	/**
	 * Delete a stopwatch
	 */
	delete(id: string) {
		// Stop animation if running
		const frame = animationFrames.get(id);
		if (frame) {
			cancelAnimationFrame(frame);
			animationFrames.delete(id);
		}

		stopwatches = stopwatches.filter((sw) => sw.id !== id);

		// Update focused if needed
		if (focusedId === id) {
			focusedId = stopwatches.length > 0 ? stopwatches[0].id : null;
		}
		saveToStorage();
	},

	/**
	 * Update stopwatch label
	 */
	updateLabel(id: string, label: string) {
		stopwatches = stopwatches.map((sw) => (sw.id === id ? { ...sw, label } : sw));
		saveToStorage();
	},

	/**
	 * Update stopwatch color
	 */
	updateColor(id: string, color: string) {
		stopwatches = stopwatches.map((sw) => (sw.id === id ? { ...sw, color } : sw));
		saveToStorage();
	},

	/**
	 * Set focused stopwatch
	 */
	setFocused(id: string | null) {
		focusedId = id;
	},

	/**
	 * Start a stopwatch
	 */
	start(id: string) {
		const sw = stopwatches.find((s) => s.id === id);
		if (sw && !sw.isRunning) {
			stopwatches = stopwatches.map((s) =>
				s.id === id ? { ...s, isRunning: true, startTime: Date.now() } : s
			);
			updateTime(id);
		}
	},

	/**
	 * Pause a stopwatch
	 */
	pause(id: string) {
		const sw = stopwatches.find((s) => s.id === id);
		if (sw && sw.isRunning) {
			// Cancel animation frame
			const frame = animationFrames.get(id);
			if (frame) {
				cancelAnimationFrame(frame);
				animationFrames.delete(id);
			}

			stopwatches = stopwatches.map((s) =>
				s.id === id
					? {
							...s,
							isRunning: false,
							pausedTime: s.elapsedTime,
							startTime: null,
						}
					: s
			);
			saveToStorage();
		}
	},

	/**
	 * Toggle start/pause
	 */
	toggle(id: string) {
		const sw = stopwatches.find((s) => s.id === id);
		if (sw) {
			if (sw.isRunning) {
				this.pause(id);
			} else {
				this.start(id);
			}
		}
	},

	/**
	 * Record a lap
	 */
	lap(id: string) {
		const sw = stopwatches.find((s) => s.id === id);
		if (sw && sw.elapsedTime > 0) {
			const lastLapTime = sw.laps.length > 0 ? sw.laps[sw.laps.length - 1].splitTime : 0;
			const lapTime = sw.elapsedTime - lastLapTime;

			const newLap: Lap = {
				number: sw.laps.length + 1,
				time: lapTime,
				splitTime: sw.elapsedTime,
			};

			stopwatches = stopwatches.map((s) => (s.id === id ? { ...s, laps: [...s.laps, newLap] } : s));
			saveToStorage();
		}
	},

	/**
	 * Reset a stopwatch
	 */
	reset(id: string) {
		// Cancel animation frame
		const frame = animationFrames.get(id);
		if (frame) {
			cancelAnimationFrame(frame);
			animationFrames.delete(id);
		}

		stopwatches = stopwatches.map((s) =>
			s.id === id
				? {
						...s,
						isRunning: false,
						elapsedTime: 0,
						laps: [],
						startTime: null,
						pausedTime: 0,
					}
				: s
		);
		saveToStorage();
	},

	/**
	 * Get best lap for a stopwatch
	 */
	getBestLap(id: string): Lap | null {
		const sw = stopwatches.find((s) => s.id === id);
		if (!sw || sw.laps.length < 2) return null;
		return sw.laps.reduce((best, lap) => (lap.time < best.time ? lap : best));
	},

	/**
	 * Get worst lap for a stopwatch
	 */
	getWorstLap(id: string): Lap | null {
		const sw = stopwatches.find((s) => s.id === id);
		if (!sw || sw.laps.length < 2) return null;
		return sw.laps.reduce((worst, lap) => (lap.time > worst.time ? lap : worst));
	},

	/**
	 * Clear all stopwatches
	 */
	clearAll() {
		// Stop all animations
		animationFrames.forEach((frame) => cancelAnimationFrame(frame));
		animationFrames.clear();

		stopwatches = [];
		focusedId = null;
		saveToStorage();
	},
};

// Legacy single stopwatch store for backwards compatibility
export const stopwatchStore = {
	get isRunning() {
		const focused = stopwatchesStore.focusedStopwatch;
		return focused?.isRunning || false;
	},
	get elapsedTime() {
		const focused = stopwatchesStore.focusedStopwatch;
		return focused?.elapsedTime || 0;
	},
	get laps() {
		const focused = stopwatchesStore.focusedStopwatch;
		return focused?.laps || [];
	},
	get formattedTime() {
		return formatTime(this.elapsedTime);
	},
	get bestLap() {
		const focused = stopwatchesStore.focusedStopwatch;
		return focused ? stopwatchesStore.getBestLap(focused.id) : null;
	},
	get worstLap() {
		const focused = stopwatchesStore.focusedStopwatch;
		return focused ? stopwatchesStore.getWorstLap(focused.id) : null;
	},
	start() {
		const id = stopwatchesStore.focusedId;
		if (id) stopwatchesStore.start(id);
		else {
			const newId = stopwatchesStore.create();
			stopwatchesStore.start(newId);
		}
	},
	pause() {
		const id = stopwatchesStore.focusedId;
		if (id) stopwatchesStore.pause(id);
	},
	toggle() {
		const id = stopwatchesStore.focusedId;
		if (id) stopwatchesStore.toggle(id);
		else {
			const newId = stopwatchesStore.create();
			stopwatchesStore.start(newId);
		}
	},
	lap() {
		const id = stopwatchesStore.focusedId;
		if (id) stopwatchesStore.lap(id);
	},
	reset() {
		const id = stopwatchesStore.focusedId;
		if (id) stopwatchesStore.reset(id);
	},
};

/**
 * Format milliseconds to HH:MM:SS.ms
 */
export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const centiseconds = Math.floor((ms % 1000) / 10);

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	}

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to MM:SS.ms (short format for laps)
 */
export function formatLapTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const centiseconds = Math.floor((ms % 1000) / 10);

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}
