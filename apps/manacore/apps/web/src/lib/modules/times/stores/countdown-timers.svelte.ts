/**
 * Countdown Timers Store — Mutation-Only Service (merged from clock module)
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, start, pause, reset).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalCountdownTimer } from '../types';
import { toCountdownTimer } from '../queries';
import type { CreateTimerInput, UpdateTimerInput } from '../types';
import { ClockEvents } from '@manacore/shared-utils/analytics';

let error = $state<string | null>(null);

export const countdownTimersStore = {
	get error() {
		return error;
	},

	/**
	 * Create a new countdown timer -- writes to IndexedDB instantly.
	 */
	async createTimer(input: CreateTimerInput) {
		error = null;
		try {
			const newLocal: LocalCountdownTimer = {
				id: crypto.randomUUID(),
				label: input.label ?? null,
				durationSeconds: input.durationSeconds,
				remainingSeconds: null,
				status: 'idle',
				startedAt: null,
				pausedAt: null,
				sound: input.sound ?? null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await db.table<LocalCountdownTimer>('timeCountdownTimers').add(newLocal);
			return { success: true, data: toCountdownTimer(newLocal) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create timer';
			console.error('Failed to create timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update a countdown timer -- writes to IndexedDB instantly.
	 */
	async updateTimer(id: string, input: UpdateTimerInput) {
		error = null;
		try {
			const updateData: Partial<LocalCountdownTimer> = {
				updatedAt: new Date().toISOString(),
			};
			if (input.label !== undefined) updateData.label = input.label ?? null;
			if (input.durationSeconds !== undefined) updateData.durationSeconds = input.durationSeconds;
			if (input.sound !== undefined) updateData.sound = input.sound ?? null;

			await db.table('timeCountdownTimers').update(id, updateData);
			const updated = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (updated) {
				return { success: true, data: toCountdownTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update timer';
			console.error('Failed to update timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Start a countdown timer -- sets status to running with current timestamp.
	 */
	async startTimer(id: string) {
		error = null;
		try {
			const existing = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

			const updateData: Partial<LocalCountdownTimer> = {
				status: 'running',
				startedAt: new Date().toISOString(),
				pausedAt: null,
				updatedAt: new Date().toISOString(),
			};

			// If resuming from pause, keep remaining seconds
			if (existing.status !== 'paused') {
				updateData.remainingSeconds = existing.durationSeconds;
			}

			await db.table('timeCountdownTimers').update(id, updateData);
			const updated = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (updated) {
				const updatedTimer = toCountdownTimer(updated);
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
	 * Pause a countdown timer -- calculates remaining seconds and saves.
	 */
	async pauseTimer(id: string) {
		error = null;
		try {
			const existing = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

			// Calculate remaining seconds
			let remaining = existing.remainingSeconds ?? existing.durationSeconds;
			if (existing.startedAt) {
				const elapsed = (Date.now() - new Date(existing.startedAt).getTime()) / 1000;
				remaining = Math.max(0, remaining - elapsed);
			}

			const updateData: Partial<LocalCountdownTimer> = {
				status: 'paused',
				pausedAt: new Date().toISOString(),
				remainingSeconds: Math.round(remaining),
				startedAt: null,
				updatedAt: new Date().toISOString(),
			};

			await db.table('timeCountdownTimers').update(id, updateData);
			const updated = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (updated) {
				return { success: true, data: toCountdownTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to pause timer';
			console.error('Failed to pause timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Reset a countdown timer -- back to idle with full duration.
	 */
	async resetTimer(id: string) {
		error = null;
		try {
			const updateData: Partial<LocalCountdownTimer> = {
				status: 'idle',
				remainingSeconds: null,
				startedAt: null,
				pausedAt: null,
				updatedAt: new Date().toISOString(),
			};

			await db.table('timeCountdownTimers').update(id, updateData);
			const updated = await db.table<LocalCountdownTimer>('timeCountdownTimers').get(id);
			if (updated) {
				return { success: true, data: toCountdownTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reset timer';
			console.error('Failed to reset timer:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Delete a countdown timer -- soft-deletes from IndexedDB instantly.
	 */
	async deleteTimer(id: string) {
		error = null;
		try {
			await db.table('timeCountdownTimers').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
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
			await db.table('timeCountdownTimers').update(id, { remainingSeconds });
		} catch (e) {
			console.error('Failed to update local timer:', e);
		}
	},
};
