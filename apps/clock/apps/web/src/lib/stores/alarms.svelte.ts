/**
 * Alarms Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import { alarmCollection, type LocalAlarm } from '$lib/data/local-store';
import type { Alarm, CreateAlarmInput, UpdateAlarmInput } from '@clock/shared';

// State — populated from IndexedDB
let alarms = $state<Alarm[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalAlarm (IndexedDB record) to the shared Alarm type. */
function toAlarm(local: LocalAlarm): Alarm {
	return {
		id: local.id,
		userId: 'local',
		label: local.label,
		time: local.time,
		enabled: local.enabled,
		repeatDays: local.repeatDays,
		snoozeMinutes: local.snoozeMinutes,
		sound: local.sound,
		vibrate: local.vibrate ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Load alarms from IndexedDB into the reactive state. */
async function refreshAlarms() {
	const localAlarms = await alarmCollection.getAll();
	alarms = localAlarms.map(toAlarm);
}

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
	 * Fetch all alarms — reads from IndexedDB.
	 */
	async fetchAlarms() {
		loading = true;
		error = null;
		try {
			await refreshAlarms();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch alarms';
			console.error('Failed to fetch alarms:', e);
		} finally {
			loading = false;
		}
		return { success: true };
	},

	/**
	 * Create a new alarm — writes to IndexedDB instantly.
	 */
	async createAlarm(input: CreateAlarmInput) {
		error = null;
		try {
			const newLocal: LocalAlarm = {
				id: crypto.randomUUID(),
				label: input.label ?? null,
				time: input.time,
				enabled: input.enabled ?? true,
				repeatDays: input.repeatDays ?? null,
				snoozeMinutes: input.snoozeMinutes ?? null,
				sound: input.sound ?? null,
				vibrate: input.vibrate ?? null,
			};

			const inserted = await alarmCollection.insert(newLocal);
			const newAlarm = toAlarm(inserted);
			alarms = [...alarms, newAlarm];
			return { success: true, data: newAlarm };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create alarm';
			console.error('Failed to create alarm:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update an alarm — writes to IndexedDB instantly.
	 */
	async updateAlarm(id: string, input: UpdateAlarmInput) {
		error = null;
		try {
			const updateData: Partial<LocalAlarm> = {};
			if (input.label !== undefined) updateData.label = input.label ?? null;
			if (input.time !== undefined) updateData.time = input.time;
			if (input.enabled !== undefined) updateData.enabled = input.enabled;
			if (input.repeatDays !== undefined) updateData.repeatDays = input.repeatDays ?? null;
			if (input.snoozeMinutes !== undefined) updateData.snoozeMinutes = input.snoozeMinutes ?? null;
			if (input.sound !== undefined) updateData.sound = input.sound ?? null;
			if (input.vibrate !== undefined) updateData.vibrate = input.vibrate ?? null;

			const updated = await alarmCollection.update(id, updateData);
			if (updated) {
				const updatedAlarm = toAlarm(updated);
				alarms = alarms.map((a) => (a.id === id ? updatedAlarm : a));
				return { success: true, data: updatedAlarm };
			}
			return { success: false, error: 'Alarm not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update alarm';
			console.error('Failed to update alarm:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Toggle alarm enabled state.
	 */
	async toggleAlarm(id: string) {
		const alarm = alarms.find((a) => a.id === id);
		if (!alarm) return { success: false, error: 'Alarm not found' };

		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	/**
	 * Delete an alarm — removes from IndexedDB instantly.
	 */
	async deleteAlarm(id: string) {
		error = null;
		try {
			await alarmCollection.delete(id);
			alarms = alarms.filter((a) => a.id !== id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete alarm';
			console.error('Failed to delete alarm:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Clear all alarms (local state only).
	 */
	clear() {
		alarms = [];
		error = null;
	},

	/**
	 * No longer relevant — all alarms are local and editable.
	 */
	get sessionAlarmCount(): number {
		return 0;
	},

	get hasSessionAlarms(): boolean {
		return false;
	},

	async migrateSessionAlarms(): Promise<void> {
		// No-op: local-first mode handles data persistence automatically.
	},

	isSessionAlarm(_id: string): boolean {
		return false;
	},
};
