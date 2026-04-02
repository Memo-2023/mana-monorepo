/**
 * Countdown Timers Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in queries.ts.
 * This store only provides write operations (create, update, delete, start, pause, reset).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { countdownTimerCollection, type LocalCountdownTimer } from '$lib/data/local-store';
import { toCountdownTimer } from '$lib/data/queries';
import type { CreateCountdownTimerInput, UpdateCountdownTimerInput } from '@times/shared';

let error = $state<string | null>(null);

export const countdownTimersStore = {
	get error() {
		return error;
	},

	async createTimer(input: CreateCountdownTimerInput) {
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
			};

			const inserted = await countdownTimerCollection.insert(newLocal);
			return { success: true, data: toCountdownTimer(inserted) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create timer';
			console.error('Failed to create timer:', e);
			return { success: false, error: error };
		}
	},

	async updateTimer(id: string, input: UpdateCountdownTimerInput) {
		error = null;
		try {
			const updateData: Partial<LocalCountdownTimer> = {};
			if (input.label !== undefined) updateData.label = input.label ?? null;
			if (input.durationSeconds !== undefined) updateData.durationSeconds = input.durationSeconds;
			if (input.sound !== undefined) updateData.sound = input.sound ?? null;

			const updated = await countdownTimerCollection.update(id, updateData);
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

	async startTimer(id: string) {
		error = null;
		try {
			const existing = await countdownTimerCollection.get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

			const updateData: Partial<LocalCountdownTimer> = {
				status: 'running',
				startedAt: new Date().toISOString(),
				pausedAt: null,
			};

			if (existing.status !== 'paused') {
				updateData.remainingSeconds = existing.durationSeconds;
			}

			const updated = await countdownTimerCollection.update(id, updateData);
			if (updated) {
				return { success: true, data: toCountdownTimer(updated) };
			}
			return { success: false, error: 'Timer not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start timer';
			console.error('Failed to start timer:', e);
			return { success: false, error: error };
		}
	},

	async pauseTimer(id: string) {
		error = null;
		try {
			const existing = await countdownTimerCollection.get(id);
			if (!existing) return { success: false, error: 'Timer not found' };

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
			};

			const updated = await countdownTimerCollection.update(id, updateData);
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

	async resetTimer(id: string) {
		error = null;
		try {
			const updateData: Partial<LocalCountdownTimer> = {
				status: 'idle',
				remainingSeconds: null,
				startedAt: null,
				pausedAt: null,
			};

			const updated = await countdownTimerCollection.update(id, updateData);
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

	async deleteTimer(id: string) {
		error = null;
		try {
			await countdownTimerCollection.delete(id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete timer';
			console.error('Failed to delete timer:', e);
			return { success: false, error: error };
		}
	},

	async updateLocalTimer(id: string, remainingSeconds: number) {
		try {
			await countdownTimerCollection.update(id, { remainingSeconds });
		} catch (e) {
			console.error('Failed to update local timer:', e);
		}
	},
};
