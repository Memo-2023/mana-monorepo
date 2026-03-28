/**
 * Timers Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in queries.ts.
 * This store only provides write operations (create, update, delete, start, pause, reset).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { timerCollection, type LocalTimer } from '$lib/data/local-store';
import { toTimer } from '$lib/data/queries';
import type { CreateTimerInput, UpdateTimerInput } from '@clock/shared';
import { ClockEvents } from '@manacore/shared-utils/analytics';

let error = $state<string | null>(null);

export const timersStore = {
	get error() {
		return error;
	},

	/**
	 * Create a new timer -- writes to IndexedDB instantly.
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
			return { success: true, data: toTimer(inserted) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create timer';
			console.error('Failed to create timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update a timer -- writes to IndexedDB instantly.
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
				return { success: true, data: toTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update timer';
			console.error('Failed to update timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Start a timer -- sets status to running with current timestamp.
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
				ClockEvents.timerStarted(
					(updatedTimer as any).type as 'pomodoro' | 'stopwatch' | 'countdown'
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
	 * Pause a timer -- calculates remaining seconds and saves.
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
				return { success: true, data: toTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to pause timer';
			console.error('Failed to pause timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Reset a timer -- back to idle with full duration.
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
				return { success: true, data: toTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reset timer';
			console.error('Failed to reset timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Delete a timer -- removes from IndexedDB instantly.
	 */
	async deleteTimer(id: string) {
		error = null;
		try {
			await timerCollection.delete(id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete timer';
			console.error('Failed to delete timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update remaining seconds in IndexedDB (for countdown display).
	 */
	async updateLocalTimer(id: string, remainingSeconds: number) {
		try {
			await timerCollection.update(id, { remainingSeconds });
		} catch (e) {
			console.error('Failed to update local timer:', e);
		}
	},
};
