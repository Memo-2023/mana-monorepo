/**
 * Stopwatch Store - Local-only stopwatch state using Svelte 5 runes
 */

export interface Lap {
	number: number;
	time: number; // milliseconds
	splitTime: number; // total time at lap
}

// State
let isRunning = $state(false);
let elapsedTime = $state(0); // milliseconds
let laps = $state<Lap[]>([]);
let startTime = $state<number | null>(null);
let pausedTime = $state(0);

// Animation frame for updating time
let animationFrameId: number | null = null;

function updateTime() {
	if (startTime !== null && isRunning) {
		elapsedTime = pausedTime + (Date.now() - startTime);
		animationFrameId = requestAnimationFrame(updateTime);
	}
}

export const stopwatchStore = {
	// Getters
	get isRunning() {
		return isRunning;
	},
	get elapsedTime() {
		return elapsedTime;
	},
	get laps() {
		return laps;
	},
	get formattedTime() {
		return formatTime(elapsedTime);
	},
	get bestLap() {
		if (laps.length < 2) return null;
		return laps.reduce((best, lap) => (lap.time < best.time ? lap : best));
	},
	get worstLap() {
		if (laps.length < 2) return null;
		return laps.reduce((worst, lap) => (lap.time > worst.time ? lap : worst));
	},

	/**
	 * Start the stopwatch
	 */
	start() {
		if (!isRunning) {
			isRunning = true;
			startTime = Date.now();
			updateTime();
		}
	},

	/**
	 * Pause the stopwatch
	 */
	pause() {
		if (isRunning) {
			isRunning = false;
			pausedTime = elapsedTime;
			startTime = null;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	},

	/**
	 * Toggle start/pause
	 */
	toggle() {
		if (isRunning) {
			this.pause();
		} else {
			this.start();
		}
	},

	/**
	 * Record a lap
	 */
	lap() {
		if (elapsedTime > 0) {
			const lastLapTime = laps.length > 0 ? laps[laps.length - 1].splitTime : 0;
			const lapTime = elapsedTime - lastLapTime;

			laps = [
				...laps,
				{
					number: laps.length + 1,
					time: lapTime,
					splitTime: elapsedTime,
				},
			];
		}
	},

	/**
	 * Reset the stopwatch
	 */
	reset() {
		isRunning = false;
		elapsedTime = 0;
		laps = [];
		startTime = null;
		pausedTime = 0;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
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
