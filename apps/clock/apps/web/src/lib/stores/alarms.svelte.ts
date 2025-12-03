/**
 * Alarms Store - Manages alarm state using Svelte 5 runes
 */

import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';
import { alarmsApi } from '$lib/api/alarms';

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
	get nextAlarm() {
		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();

		const enabled = alarms.filter((a) => a.enabled);
		if (enabled.length === 0) return null;

		// Find the next alarm based on time
		let nextAlarm: Alarm | null = null;
		let minDiff = Infinity;

		for (const alarm of enabled) {
			const [hours, minutes] = alarm.time.split(':').map(Number);
			const alarmTime = hours * 60 + minutes;
			let diff = alarmTime - currentTime;
			if (diff < 0) diff += 24 * 60; // Tomorrow

			if (diff < minDiff) {
				minDiff = diff;
				nextAlarm = alarm;
			}
		}

		return nextAlarm;
	},

	/**
	 * Fetch all alarms from the API
	 */
	async fetchAlarms() {
		loading = true;
		error = null;

		const result = await alarmsApi.getAll();

		if (result.error) {
			error = result.error;
		} else if (result.data) {
			alarms = result.data;
		}

		loading = false;
	},

	/**
	 * Create a new alarm
	 */
	async createAlarm(input: CreateAlarmInput) {
		const result = await alarmsApi.create(input);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			alarms = [...alarms, result.data];
		}

		return { success: true };
	},

	/**
	 * Update an existing alarm
	 */
	async updateAlarm(id: string, input: UpdateAlarmInput) {
		const result = await alarmsApi.update(id, input);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			alarms = alarms.map((a) => (a.id === id ? result.data! : a));
		}

		return { success: true };
	},

	/**
	 * Delete an alarm
	 */
	async deleteAlarm(id: string) {
		const result = await alarmsApi.delete(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		alarms = alarms.filter((a) => a.id !== id);
		return { success: true };
	},

	/**
	 * Toggle an alarm's enabled state
	 */
	async toggleAlarm(id: string) {
		const result = await alarmsApi.toggle(id);

		if (result.error) {
			return { success: false, error: result.error };
		}

		if (result.data) {
			alarms = alarms.map((a) => (a.id === id ? result.data! : a));
		}

		return { success: true };
	},
};
