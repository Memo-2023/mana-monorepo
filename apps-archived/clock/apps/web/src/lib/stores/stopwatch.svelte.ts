/**
 * Stopwatch Store - Manages stopwatch state using Svelte 5 runes
 * Stopwatches are local-only (no backend sync)
 */

export interface Lap {
	number: number;
	time: number; // milliseconds since start
	delta: number; // milliseconds since last lap
}

export interface Stopwatch {
	id: string;
	label: string;
	startTime: number | null; // timestamp when started
	elapsedTime: number; // accumulated milliseconds when paused
	status: 'idle' | 'running' | 'paused';
	laps: Lap[];
	color: string;
}

export const STOPWATCH_COLORS = [
	'#3B82F6', // blue
	'#10B981', // green
	'#F59E0B', // amber
	'#EF4444', // red
	'#8B5CF6', // violet
	'#EC4899', // pink
	'#14B8A6', // teal
	'#F97316', // orange
];

// State
let stopwatches = $state<Stopwatch[]>([]);
let focusedId = $state<string | null>(null);
let colorIndex = 0;

// Tick interval for updating display
let tickInterval: ReturnType<typeof setInterval> | null = null;

function getNextColor(): string {
	const color = STOPWATCH_COLORS[colorIndex % STOPWATCH_COLORS.length];
	colorIndex++;
	return color;
}

function startTicking() {
	if (tickInterval) return;
	tickInterval = setInterval(() => {
		// Force reactivity update by reassigning
		stopwatches = [...stopwatches];
	}, 100);
}

function stopTickingIfNoRunning() {
	const hasRunning = stopwatches.some((sw) => sw.status === 'running');
	if (!hasRunning && tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
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

	/**
	 * Create a new stopwatch
	 */
	create(label?: string): string {
		const id = crypto.randomUUID();
		const newStopwatch: Stopwatch = {
			id,
			label: label || `Stopwatch ${stopwatches.length + 1}`,
			startTime: null,
			elapsedTime: 0,
			status: 'idle',
			laps: [],
			color: getNextColor(),
		};
		stopwatches = [...stopwatches, newStopwatch];
		if (!focusedId) {
			focusedId = id;
		}
		return id;
	},

	/**
	 * Start a stopwatch
	 */
	start(id: string) {
		stopwatches = stopwatches.map((sw) => {
			if (sw.id !== id) return sw;
			return {
				...sw,
				startTime: Date.now(),
				status: 'running' as const,
			};
		});
		startTicking();
	},

	/**
	 * Pause a stopwatch
	 */
	pause(id: string) {
		stopwatches = stopwatches.map((sw) => {
			if (sw.id !== id || sw.status !== 'running') return sw;
			const elapsed = sw.startTime ? Date.now() - sw.startTime : 0;
			return {
				...sw,
				startTime: null,
				elapsedTime: sw.elapsedTime + elapsed,
				status: 'paused' as const,
			};
		});
		stopTickingIfNoRunning();
	},

	/**
	 * Reset a stopwatch
	 */
	reset(id: string) {
		stopwatches = stopwatches.map((sw) => {
			if (sw.id !== id) return sw;
			return {
				...sw,
				startTime: null,
				elapsedTime: 0,
				status: 'idle' as const,
				laps: [],
			};
		});
		stopTickingIfNoRunning();
	},

	/**
	 * Add a lap to a stopwatch
	 */
	addLap(id: string) {
		stopwatches = stopwatches.map((sw) => {
			if (sw.id !== id || sw.status !== 'running') return sw;
			const currentTime = this.getElapsed(sw);
			const lastLap = sw.laps[sw.laps.length - 1];
			const delta = lastLap ? currentTime - lastLap.time : currentTime;
			const newLap: Lap = {
				number: sw.laps.length + 1,
				time: currentTime,
				delta,
			};
			return {
				...sw,
				laps: [...sw.laps, newLap],
			};
		});
	},

	/**
	 * Delete a stopwatch
	 */
	delete(id: string) {
		stopwatches = stopwatches.filter((sw) => sw.id !== id);
		if (focusedId === id) {
			focusedId = stopwatches[0]?.id || null;
		}
		stopTickingIfNoRunning();
	},

	/**
	 * Set focused stopwatch
	 */
	setFocused(id: string | null) {
		focusedId = id;
	},

	/**
	 * Update stopwatch label
	 */
	updateLabel(id: string, label: string) {
		stopwatches = stopwatches.map((sw) => (sw.id === id ? { ...sw, label } : sw));
	},

	/**
	 * Get elapsed time for a stopwatch
	 */
	getElapsed(sw: Stopwatch): number {
		if (sw.status === 'running' && sw.startTime) {
			return sw.elapsedTime + (Date.now() - sw.startTime);
		}
		return sw.elapsedTime;
	},
};

/**
 * Format time in milliseconds to display string
 */
export function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const centiseconds = Math.floor((ms % 1000) / 10);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	}
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Format lap time (delta) for display
 */
export function formatLapTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const centiseconds = Math.floor((ms % 1000) / 10);

	if (minutes > 0) {
		return `+${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	}
	return `+${seconds}.${centiseconds.toString().padStart(2, '0')}`;
}
