/**
 * Alarms Store - Manages alarm state using Svelte 5 runes
 */

import { api } from '$lib/api/client';
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
	 */
	async fetchAlarms() {
		loading = true;
		error = null;

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
	 */
	async createAlarm(input: CreateAlarmInput) {
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
	 */
	async updateAlarm(id: string, input: UpdateAlarmInput) {
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
	 */
	async deleteAlarm(id: string) {
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
};
