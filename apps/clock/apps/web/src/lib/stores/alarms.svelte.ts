/**
 * Alarms Store - Manages alarm state using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import { api } from '$lib/api/client';
import { sessionAlarmsStore } from './session-alarms.svelte';
import { authStore } from './auth.svelte';
import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';

// State
let alarms = $state<Alarm[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const alarmsStore = {
	// Getters
	get alarms() {
		return alarms;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get enabledAlarms() {
		return alarms.filter((a) => a.enabled);
	},

	/**
	 * Fetch all alarms from the backend
	 * In guest mode, loads from session storage
	 */
	async fetchAlarms() {
		loading = true;
		error = null;

		// Guest mode: load from session storage
		if (!authStore.isAuthenticated) {
			alarms = sessionAlarmsStore.alarms;
			loading = false;
			return { success: true };
		}

		// Authenticated: fetch from API
		const response = await api.get<Alarm[]>('/alarms');

		if (response.error) {
			error = response.error;
			loading = false;
			return { success: false, error: response.error };
		}

		alarms = response.data || [];
		loading = false;
		return { success: true };
	},

	/**
	 * Create a new alarm
	 * In guest mode, creates in session storage
	 */
	async createAlarm(input: CreateAlarmInput) {
		// Guest mode: create in session storage
		if (!authStore.isAuthenticated) {
			const alarm = sessionAlarmsStore.createAlarm(input);
			alarms = [...alarms, alarm];
			return { success: true, data: alarm };
		}

		// Authenticated: create via API
		const response = await api.post<Alarm>('/alarms', input);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			alarms = [...alarms, response.data];
		}
		return { success: true, data: response.data };
	},

	/**
	 * Update an alarm
	 * In guest mode, updates in session storage
	 */
	async updateAlarm(id: string, input: UpdateAlarmInput) {
		// Guest mode: update in session storage
		if (!authStore.isAuthenticated || sessionAlarmsStore.isSessionAlarm(id)) {
			const alarm = sessionAlarmsStore.updateAlarm(id, input);
			if (alarm) {
				alarms = alarms.map((a) => (a.id === id ? alarm : a));
				return { success: true, data: alarm };
			}
			return { success: false, error: 'Alarm not found' };
		}

		// Authenticated: update via API
		const response = await api.patch<Alarm>(`/alarms/${id}`, input);

		if (response.error) {
			return { success: false, error: response.error };
		}

		if (response.data) {
			alarms = alarms.map((a) => (a.id === id ? response.data! : a));
		}
		return { success: true, data: response.data };
	},

	/**
	 * Toggle alarm enabled state
	 */
	async toggleAlarm(id: string) {
		const alarm = alarms.find((a) => a.id === id);
		if (!alarm) return { success: false, error: 'Alarm not found' };

		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	/**
	 * Delete an alarm
	 * In guest mode, deletes from session storage
	 */
	async deleteAlarm(id: string) {
		// Guest mode: delete from session storage
		if (!authStore.isAuthenticated || sessionAlarmsStore.isSessionAlarm(id)) {
			sessionAlarmsStore.deleteAlarm(id);
			alarms = alarms.filter((a) => a.id !== id);
			return { success: true };
		}

		// Authenticated: delete via API
		const response = await api.delete(`/alarms/${id}`);

		if (response.error) {
			return { success: false, error: response.error };
		}

		alarms = alarms.filter((a) => a.id !== id);
		return { success: true };
	},

	/**
	 * Clear all alarms (local state only)
	 */
	clear() {
		alarms = [];
		error = null;
	},

	/**
	 * Get session alarm count (for guest mode banner)
	 */
	get sessionAlarmCount(): number {
		return sessionAlarmsStore.count;
	},

	/**
	 * Check if there are session alarms
	 */
	get hasSessionAlarms(): boolean {
		return sessionAlarmsStore.count > 0;
	},

	/**
	 * Migrate session alarms to cloud after login
	 */
	async migrateSessionAlarms(): Promise<void> {
		if (!authStore.isAuthenticated) return;

		const sessionAlarms = sessionAlarmsStore.getAllAlarms();
		if (sessionAlarms.length === 0) return;

		// Create each alarm via API
		for (const alarm of sessionAlarms) {
			try {
				await api.post<Alarm>('/alarms', {
					label: alarm.label,
					time: alarm.time,
					enabled: alarm.enabled,
					repeatDays: alarm.repeatDays,
					snoozeMinutes: alarm.snoozeMinutes,
					sound: alarm.sound,
					vibrate: alarm.vibrate,
				});
			} catch (e) {
				console.error('Failed to migrate alarm:', e);
			}
		}

		// Clear session data after migration
		sessionAlarmsStore.clear();

		// Reload alarms from server
		await this.fetchAlarms();
	},

	/**
	 * Check if an alarm ID is a session alarm
	 */
	isSessionAlarm(id: string): boolean {
		return sessionAlarmsStore.isSessionAlarm(id);
	},
};
