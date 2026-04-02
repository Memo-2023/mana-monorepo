/**
 * Alarms Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in queries.ts.
 * This store only provides write operations (create, update, delete, toggle).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { alarmCollection, type LocalAlarm } from '$lib/data/local-store';
import { toAlarm } from '$lib/data/queries';
import type { CreateAlarmInput, UpdateAlarmInput, Alarm } from '@times/shared';

let error = $state<string | null>(null);

export const alarmsStore = {
	get error() {
		return error;
	},

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
			return { success: true, data: toAlarm(inserted) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create alarm';
			console.error('Failed to create alarm:', e);
			return { success: false, error: error };
		}
	},

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
				return { success: true, data: toAlarm(updated) };
			}
			return { success: false, error: 'Alarm not found' };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update alarm';
			console.error('Failed to update alarm:', e);
			return { success: false, error: error };
		}
	},

	async toggleAlarm(id: string, currentAlarms: Alarm[]) {
		const alarm = currentAlarms.find((a) => a.id === id);
		if (!alarm) return { success: false, error: 'Alarm not found' };

		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	async deleteAlarm(id: string) {
		error = null;
		try {
			await alarmCollection.delete(id);
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete alarm';
			console.error('Failed to delete alarm:', e);
			return { success: false, error: error };
		}
	},
};
