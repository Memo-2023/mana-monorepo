/**
 * Timers Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import { timerCollection, type LocalTimer } from '$lib/data/local-store';
import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';
import { ClockEvents } from '@manacore/shared-utils/analytics';

// State — populated from IndexedDB
let timers = $state<Timer[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalTimer (IndexedDB record) to the shared Timer type. */
function toTimer(local: LocalTimer): Timer {
	return {
		id: local.id,
		userId: 'local',
		label: local.label,
		durationSeconds: local.durationSeconds,
		remainingSeconds: local.remainingSeconds,
		status: local.status,
		startedAt: local.startedAt,
		pausedAt: local.pausedAt,
		sound: local.sound,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Load timers from IndexedDB into the reactive state. */
async function refreshTimers() {
	const localTimers = await timerCollection.getAll();
	timers = localTimers.map(toTimer);
}

export const timersStore = {
	// Getters
	get timers() {
		return timers;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get activeTimers() {
		return timers.filter((t) => t.status === 'running' || t.status === 'paused');
	},

	/**
	 * Fetch all timers — reads from IndexedDB.
	 */
	async fetchTimers() {
		loading = true;
		error = null;
		try {
			await refreshTimers();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch timers';
			console.error('Failed to fetch timers:', e);
		} finally {
			loading = false;
		}
		return { success: true };
	},

	/**
	 * Create a new timer — writes to IndexedDB instantly.
	 */
	async createTimer(input: CreateTimerInput) {
		error = null;
		try {
			const newLocal: LocalTimer = {
				id: crypto.randomUUID(),
				label: input.label ?? null,
				durationSeconds: input.durationSeconds,
				remainingSeconds: null,
				status: 'idle',
				startedAt: null,
				pausedAt: null,
				sound: input.sound ?? null,
			};

			const inserted = await timerCollection.insert(newLocal);
			const newTimer = toTimer(inserted);
			timers = [...timers, newTimer];
			return { success: true, data: newTimer };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create timer';
			console.error('Failed to create timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update a timer — writes to IndexedDB instantly.
	 */
	async updateTimer(id: string, input: UpdateTimerInput) {
		error = null;
		try {
			const updateData: Partial<LocalTimer> = {};
			if (input.label !== undefined) updateData.label = input.label ?? null;
			if (input.durationSeconds !== undefined) updateData.durationSeconds = input.durationSeconds;
			if (input.sound !== undefined) updateData.sound = input.sound ?? null;

			const updated = await timerCollection.update(id, updateData);
			if (updated) {
				const updatedTimer = toTimer(updated);
				timers = timers.map((t) => (t.id === id ? updatedTimer : t));
				return { success: true, data: updatedTimer };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update timer';
			console.error('Failed to update timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Start a timer — sets status to running with current timestamp.
	 */
	async startTimer(id: string) {
		error = null;
		try {
			const existing = await timerCollection.get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

			const updateData: Partial<LocalTimer> = {
				status: 'running',
				startedAt: new Date().toISOString(),
				pausedAt: null,
			};

			// If resuming from pause, keep remaining seconds
			if (existing.status !== 'paused') {
				updateData.remainingSeconds = existing.durationSeconds;
			}

			const updated = await timerCollection.update(id, updateData);
			if (updated) {
				const updatedTimer = toTimer(updated);
				timers = timers.map((t) => (t.id === id ? updatedTimer : t));
				ClockEvents.timerStarted(
					(updatedTimer as Timer & { type?: string }).type as 'pomodoro' | 'stopwatch' | 'countdown'
				);
				return { success: true, data: updatedTimer };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start timer';
			console.error('Failed to start timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Pause a timer — calculates remaining seconds and saves.
	 */
	async pauseTimer(id: string) {
		error = null;
		try {
			const existing = await timerCollection.get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

			// Calculate remaining seconds
			let remaining = existing.remainingSeconds ?? existing.durationSeconds;
			if (existing.startedAt) {
				const elapsed = (Date.now() - new Date(existing.startedAt).getTime()) / 1000;
				remaining = Math.max(0, remaining - elapsed);
			}

			const updateData: Partial<LocalTimer> = {
				status: 'paused',
				pausedAt: new Date().toISOString(),
				remainingSeconds: Math.round(remaining),
				startedAt: null,
			};

			const updated = await timerCollection.update(id, updateData);
			if (updated) {
				const updatedTimer = toTimer(updated);
				timers = timers.map((t) => (t.id === id ? updatedTimer : t));
				return { success: true, data: updatedTimer };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to pause timer';
			console.error('Failed to pause timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Reset a timer — back to idle with full duration.
	 */
	async resetTimer(id: string) {
		error = null;
		try {
			const updateData: Partial<LocalTimer> = {
				status: 'idle',
				remainingSeconds: null,
				startedAt: null,
				pausedAt: null,
			};

			const updated = await timerCollection.update(id, updateData);
			if (updated) {
				const updatedTimer = toTimer(updated);
				timers = timers.map((t) => (t.id === id ? updatedTimer : t));
				return { success: true, data: updatedTimer };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reset timer';
			console.error('Failed to reset timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Delete a timer — removes from IndexedDB instantly.
	 */
	async deleteTimer(id: string) {
		error = null;
		try {
			await timerCollection.delete(id);
			timers = timers.filter((t) => t.id !== id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete timer';
			console.error('Failed to delete timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update local timer state (for countdown display).
	 */
	updateLocalState(id: string, updates: Partial<Timer>) {
		timers = timers.map((t) => (t.id === id ? { ...t, ...updates } : t));
	},

	/**
	 * Clear all timers (local state only).
	 */
	clear() {
		timers = [];
		error = null;
	},

	/**
	 * No longer relevant — all timers are local and editable.
	 */
	get sessionTimerCount(): number {
		return 0;
	},

	get hasSessionTimers(): boolean {
		return false;
	},

	async migrateSessionTimers(): Promise<void> {
		// No-op: local-first mode handles data persistence automatically.
	},

	isSessionTimer(_id: string): boolean {
		return false;
	},
};
