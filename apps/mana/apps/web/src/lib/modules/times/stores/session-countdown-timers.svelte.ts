/**
 * Session Countdown Timers Store - Manages countdown timers in sessionStorage for guest users
 * (merged from clock module)
 * This allows users to try the app without signing in.
 * Data is stored in sessionStorage (lost when tab closes).
 */

import type { Timer, CreateTimerInput, UpdateTimerInput, TimerStatus } from '../types';

const STORAGE_KEY = 'clock-session-timers';

// State
let timers = $state<Timer[]>([]);

// Generate session ID
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load from sessionStorage
function loadFromStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored) {
			timers = JSON.parse(stored);
		}
	} catch (e) {
		console.error('Failed to load session timers:', e);
	}
}

// Save to sessionStorage
function saveToStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
	} catch (e) {
		console.error('Failed to save session timers:', e);
	}
}

// Initialize on load
if (typeof window !== 'undefined') {
	loadFromStorage();
}

export const sessionCountdownTimersStore = {
	// Getters
	get timers() {
		return timers;
	},
	get activeTimers() {
		return timers.filter((t) => t.status === 'running' || t.status === 'paused');
	},

	/**
	 * Create a new session countdown timer
	 */
	createTimer(input: CreateTimerInput): Timer {
		const now = new Date().toISOString();
		const timer: Timer = {
			id: generateSessionId(),
			label: input.label || null,
			durationSeconds: input.durationSeconds,
			remainingSeconds: input.durationSeconds,
			status: 'idle' as TimerStatus,
			startedAt: null,
			pausedAt: null,
			sound: input.sound || null,
			createdAt: now,
			updatedAt: now,
		};

		timers = [...timers, timer];
		saveToStorage();

		return timer;
	},

	/**
	 * Update a session countdown timer
	 */
	updateTimer(id: string, input: UpdateTimerInput): Timer | null {
		const index = timers.findIndex((t) => t.id === id);
		if (index === -1) return null;

		const updated: Timer = {
			...timers[index],
			...input,
			updatedAt: new Date().toISOString(),
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();

		return updated;
	},

	/**
	 * Start a countdown timer
	 */
	startTimer(id: string): Timer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: Timer = {
			...timer,
			status: 'running',
			startedAt: now,
			pausedAt: null,
			updatedAt: now,
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();

		return updated;
	},

	/**
	 * Pause a countdown timer
	 */
	pauseTimer(id: string): Timer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: Timer = {
			...timer,
			status: 'paused',
			pausedAt: now,
			updatedAt: now,
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();

		return updated;
	},

	/**
	 * Reset a countdown timer
	 */
	resetTimer(id: string): Timer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: Timer = {
			...timer,
			status: 'idle',
			remainingSeconds: timer.durationSeconds,
			startedAt: null,
			pausedAt: null,
			updatedAt: now,
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();

		return updated;
	},

	/**
	 * Update local timer state (for countdown display)
	 */
	updateLocalState(id: string, updates: Partial<Timer>): void {
		timers = timers.map((t) => (t.id === id ? { ...t, ...updates } : t));
		saveToStorage();
	},

	/**
	 * Delete a session countdown timer
	 */
	deleteTimer(id: string): void {
		timers = timers.filter((t) => t.id !== id);
		saveToStorage();
	},

	/**
	 * Check if ID is a session timer
	 */
	isSessionTimer(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all timers for migration
	 */
	getAllTimers(): Timer[] {
		return [...timers];
	},

	/**
	 * Clear all session data
	 */
	clear(): void {
		timers = [];
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Get count of session countdown timers
	 */
	get count(): number {
		return timers.length;
	},
};
