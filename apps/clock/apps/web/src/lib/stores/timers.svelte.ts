/**
 * Timers Store - Manages timer state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';

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

	/**
	 * Fetch all timers from the backend
	 */
	async fetchTimers() {
		loading = true;
		error = null;

		const response = await api.get<Timer[]>('/timers');

		if (response.error) {
			error = response.error;
			loading = false;
			return { success: false, error: response.error };
		}

		timers = response.data || [];
		loading = false;
		return { success: true };
	},

	/**
	 * Create a new timer
	 */
	async createTimer(input: CreateTimerInput) {
		const response = await api.post<Timer>('/timers', input);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			timers = [...timers, response.data];
		}
		return { success: true, data: response.data };
	},

	/**
	 * Update a timer
	 */
	async updateTimer(id: string, input: UpdateTimerInput) {
		const response = await api.patch<Timer>(`/timers/${id}`, input);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Start a timer
	 */
	async startTimer(id: string) {
		const response = await api.post<Timer>(`/timers/${id}/start`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Pause a timer
	 */
	async pauseTimer(id: string) {
		const response = await api.post<Timer>(`/timers/${id}/pause`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Reset a timer
	 */
	async resetTimer(id: string) {
		const response = await api.post<Timer>(`/timers/${id}/reset`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Delete a timer
	 */
	async deleteTimer(id: string) {
		const response = await api.delete(`/timers/${id}`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		timers = timers.filter((t) => t.id !== id);
		return { success: true };
	},

	/**
	 * Update local timer state (for countdown display)
	 */
	updateLocalState(id: string, updates: Partial<Timer>) {
		timers = timers.map((t) => (t.id === id ? { ...t, ...updates } : t));
	},

	/**
	 * Clear all timers (local state only)
	 */
	clear() {
		timers = [];
		error = null;
	},
};
