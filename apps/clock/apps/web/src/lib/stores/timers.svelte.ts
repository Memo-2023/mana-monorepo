/**
 * Timers Store - Manages timer state using Svelte 5 runes
 */

import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';
import { timersApi } from '$lib/api/timers';

// State
let timers = $state<Timer[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

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
	get runningTimers() {
		return timers.filter((t) => t.status === 'running');
	},

	/**
	 * Fetch all timers from the API
	 */
	async fetchTimers() {
		loading = true;
		error = null;

		const result = await timersApi.getAll();

		if (result.error) {
			error = result.error;
		} else if (result.data) {
			timers = result.data;
		}

		loading = false;
	},

	/**
	 * Create a new timer
	 */
	async createTimer(input: CreateTimerInput) {
		const result = await timersApi.create(input);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			timers = [...timers, result.data];
		}

		return { success: true, data: result.data };
	},

	/**
	 * Update an existing timer
	 */
	async updateTimer(id: string, input: UpdateTimerInput) {
		const result = await timersApi.update(id, input);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			timers = timers.map((t) => (t.id === id ? result.data! : t));
		}

		return { success: true };
	},

	/**
	 * Delete a timer
	 */
	async deleteTimer(id: string) {
		const result = await timersApi.delete(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		timers = timers.filter((t) => t.id !== id);
		return { success: true };
	},

	/**
	 * Start a timer
	 */
	async startTimer(id: string) {
		const result = await timersApi.start(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			timers = timers.map((t) => (t.id === id ? result.data! : t));
		}

		return { success: true };
	},

	/**
	 * Pause a timer
	 */
	async pauseTimer(id: string) {
		const result = await timersApi.pause(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			timers = timers.map((t) => (t.id === id ? result.data! : t));
		}

		return { success: true };
	},

	/**
	 * Reset a timer
	 */
	async resetTimer(id: string) {
		const result = await timersApi.reset(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			timers = timers.map((t) => (t.id === id ? result.data! : t));
		}

		return { success: true };
	},

	/**
	 * Update local timer state (for countdown display)
	 */
	updateLocalTimer(id: string, remainingSeconds: number) {
		timers = timers.map((t) => (t.id === id ? { ...t, remainingSeconds } : t));
	},
};
