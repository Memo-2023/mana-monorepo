/**
 * Session Timers Store - Manages countdown timers in sessionStorage for guest users
 */

import type {
	CountdownTimer,
	CreateCountdownTimerInput,
	UpdateCountdownTimerInput,
	CountdownTimerStatus,
} from '@times/shared';

const STORAGE_KEY = 'times-session-timers';

let timers = $state<CountdownTimer[]>([]);

function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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

function saveToStorage(): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
	} catch (e) {
		console.error('Failed to save session timers:', e);
	}
}

if (typeof window !== 'undefined') {
	loadFromStorage();
}

export const sessionTimersStore = {
	get timers() {
		return timers;
	},
	get activeTimers() {
		return timers.filter((t) => t.status === 'running' || t.status === 'paused');
	},

	createTimer(input: CreateCountdownTimerInput): CountdownTimer {
		const now = new Date().toISOString();
		const timer: CountdownTimer = {
			id: generateSessionId(),
			userId: 'guest',
			label: input.label || null,
			durationSeconds: input.durationSeconds,
			remainingSeconds: input.durationSeconds,
			status: 'idle' as CountdownTimerStatus,
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

	updateTimer(id: string, input: UpdateCountdownTimerInput): CountdownTimer | null {
		const index = timers.findIndex((t) => t.id === id);
		if (index === -1) return null;

		const updated: CountdownTimer = {
			...timers[index],
			...input,
			updatedAt: new Date().toISOString(),
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();
		return updated;
	},

	startTimer(id: string): CountdownTimer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: CountdownTimer = {
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

	pauseTimer(id: string): CountdownTimer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: CountdownTimer = {
			...timer,
			status: 'paused',
			pausedAt: now,
			updatedAt: now,
		};

		timers = timers.map((t) => (t.id === id ? updated : t));
		saveToStorage();
		return updated;
	},

	resetTimer(id: string): CountdownTimer | null {
		const timer = timers.find((t) => t.id === id);
		if (!timer) return null;

		const now = new Date().toISOString();
		const updated: CountdownTimer = {
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

	updateLocalState(id: string, updates: Partial<CountdownTimer>): void {
		timers = timers.map((t) => (t.id === id ? { ...t, ...updates } : t));
		saveToStorage();
	},

	deleteTimer(id: string): void {
		timers = timers.filter((t) => t.id !== id);
		saveToStorage();
	},

	isSessionTimer(id: string): boolean {
		return id.startsWith('session_');
	},

	getAllTimers(): CountdownTimer[] {
		return [...timers];
	},

	clear(): void {
		timers = [];
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	get count(): number {
		return timers.length;
	},
};
