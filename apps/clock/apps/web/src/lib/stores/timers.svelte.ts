/**
 * Timers Store - Manages timer state using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import { api } from '$lib/api/client';
import { sessionTimersStore } from './session-timers.svelte';
import { authStore } from './auth.svelte';
import type { Timer, CreateTimerInput, UpdateTimerInput } from '@clock/shared';
import { ClockEvents } from '@manacore/shared-utils/analytics';

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
	 * In guest mode, loads from session storage
	 */
	async fetchTimers() {
		loading = true;
		error = null;

		// Guest mode: load from session storage
		if (!authStore.isAuthenticated) {
			timers = sessionTimersStore.timers;
			loading = false;
			return { success: true };
		}

		// Authenticated: fetch from API
		const response = await api.get<Timer[]>('/timers');

		if (response.error) {
			error = response.error.message;
			loading = false;
			return { success: false, error: response.error.message };
		}

		timers = response.data || [];
		loading = false;
		return { success: true };
	},

	/**
	 * Create a new timer
	 * In guest mode, creates in session storage
	 */
	async createTimer(input: CreateTimerInput) {
		// Guest mode: create in session storage
		if (!authStore.isAuthenticated) {
			const timer = sessionTimersStore.createTimer(input);
			timers = [...timers, timer];
			return { success: true, data: timer };
		}

		// Authenticated: create via API
		const response = await api.post<Timer>('/timers', input);

		if (response.error) {
			return { success: false, error: response.error.message };
		}

		if (response.data) {
			timers = [...timers, response.data];
		}
		return { success: true, data: response.data };
	},

	/**
	 * Update a timer
	 * In guest mode, updates in session storage
	 */
	async updateTimer(id: string, input: UpdateTimerInput) {
		// Guest mode: update in session storage
		if (!authStore.isAuthenticated || sessionTimersStore.isSessionTimer(id)) {
			const timer = sessionTimersStore.updateTimer(id, input);
			if (timer) {
				timers = timers.map((t) => (t.id === id ? timer : t));
				return { success: true, data: timer };
			}
			return { success: false, error: 'Timer not found' };
		}

		// Authenticated: update via API
		const response = await api.patch<Timer>(`/timers/${id}`, input);

		if (response.error) {
			return { success: false, error: response.error.message };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Start a timer
	 * In guest mode, starts in session storage
	 */
	async startTimer(id: string) {
		// Guest mode: start in session storage
		if (!authStore.isAuthenticated || sessionTimersStore.isSessionTimer(id)) {
			const timer = sessionTimersStore.startTimer(id);
			if (timer) {
				timers = timers.map((t) => (t.id === id ? timer : t));
				return { success: true, data: timer };
			}
			return { success: false, error: 'Timer not found' };
		}

		// Authenticated: start via API
		const response = await api.post<Timer>(`/timers/${id}/start`);

		if (response.error) {
			return { success: false, error: response.error.message };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
			ClockEvents.timerStarted(response.data.type as 'pomodoro' | 'stopwatch' | 'countdown');
		}
		return { success: true, data: response.data };
	},

	/**
	 * Pause a timer
	 * In guest mode, pauses in session storage
	 */
	async pauseTimer(id: string) {
		// Guest mode: pause in session storage
		if (!authStore.isAuthenticated || sessionTimersStore.isSessionTimer(id)) {
			const timer = sessionTimersStore.pauseTimer(id);
			if (timer) {
				timers = timers.map((t) => (t.id === id ? timer : t));
				return { success: true, data: timer };
			}
			return { success: false, error: 'Timer not found' };
		}

		// Authenticated: pause via API
		const response = await api.post<Timer>(`/timers/${id}/pause`);

		if (response.error) {
			return { success: false, error: response.error.message };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Reset a timer
	 * In guest mode, resets in session storage
	 */
	async resetTimer(id: string) {
		// Guest mode: reset in session storage
		if (!authStore.isAuthenticated || sessionTimersStore.isSessionTimer(id)) {
			const timer = sessionTimersStore.resetTimer(id);
			if (timer) {
				timers = timers.map((t) => (t.id === id ? timer : t));
				return { success: true, data: timer };
			}
			return { success: false, error: 'Timer not found' };
		}

		// Authenticated: reset via API
		const response = await api.post<Timer>(`/timers/${id}/reset`);

		if (response.error) {
			return { success: false, error: response.error.message };
		}

		if (response.data) {
			timers = timers.map((t) => (t.id === id ? response.data! : t));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Delete a timer
	 * In guest mode, deletes from session storage
	 */
	async deleteTimer(id: string) {
		// Guest mode: delete from session storage
		if (!authStore.isAuthenticated || sessionTimersStore.isSessionTimer(id)) {
			sessionTimersStore.deleteTimer(id);
			timers = timers.filter((t) => t.id !== id);
			return { success: true };
		}

		// Authenticated: delete via API
		const response = await api.delete(`/timers/${id}`);

		if (response.error) {
			return { success: false, error: response.error.message };
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

	/**
	 * Get session timer count (for guest mode banner)
	 */
	get sessionTimerCount(): number {
		return sessionTimersStore.count;
	},

	/**
	 * Check if there are session timers
	 */
	get hasSessionTimers(): boolean {
		return sessionTimersStore.count > 0;
	},

	/**
	 * Migrate session timers to cloud after login
	 */
	async migrateSessionTimers(): Promise<void> {
		if (!authStore.isAuthenticated) return;

		const sessionTimers = sessionTimersStore.getAllTimers();
		if (sessionTimers.length === 0) return;

		// Create each timer via API
		for (const timer of sessionTimers) {
			try {
				await api.post<Timer>('/timers', {
					label: timer.label,
					durationSeconds: timer.durationSeconds,
					sound: timer.sound,
				});
			} catch (e) {
				console.error('Failed to migrate timer:', e);
			}
		}

		// Clear session data after migration
		sessionTimersStore.clear();

		// Reload timers from server
		await this.fetchTimers();
	},

	/**
	 * Check if a timer ID is a session timer
	 */
	isSessionTimer(id: string): boolean {
		return sessionTimersStore.isSessionTimer(id);
	},
};
