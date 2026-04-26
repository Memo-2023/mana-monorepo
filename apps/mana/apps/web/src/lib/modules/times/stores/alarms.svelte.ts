/**
 * Alarms Store — Mutation-Only Service (merged from clock module)
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations (create, update, delete, toggle).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { db } from '$lib/data/database';
import type { LocalAlarm } from '../types';
import { toAlarm } from '../queries';
import type { CreateAlarmInput, UpdateAlarmInput, Alarm } from '../types';

let error = $state<string | null>(null);

export const alarmsStore = {
	get error() {
		return error;
	},

	/**
	 * Create a new alarm -- writes to IndexedDB instantly.
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
				createdAt: new Date().toISOString(),
			};

			await db.table<LocalAlarm>('timeAlarms').add(newLocal);
			return { success: true, data: toAlarm(newLocal) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create alarm';
			console.error('Failed to create alarm:', e);
			return { success: false, error: error };
		}
	},

	/**
	 * Update an alarm -- writes to IndexedDB instantly.
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

			await db.table('timeAlarms').update(id, updateData);
			const updated = await db.table<LocalAlarm>('timeAlarms').get(id);
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

	/**
	 * Toggle alarm enabled state.
	 */
	async toggleAlarm(id: string, currentAlarms: Alarm[]) {
		const alarm = currentAlarms.find((a) => a.id === id);
		if (!alarm) return { success: false, error: 'Alarm not found' };

		return this.updateAlarm(id, { enabled: !alarm.enabled });
	},

	/**
	 * Delete an alarm -- soft-deletes from IndexedDB instantly.
	 */
	async deleteAlarm(id: string) {
		error = null;
		try {
			await db.table('timeAlarms').update(id, {
				deletedAt: new Date().toISOString(),
			});
			return { success: true };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete alarm';
			console.error('Failed to delete alarm:', e);
			return { success: false, error: error };
		}
	},
};
