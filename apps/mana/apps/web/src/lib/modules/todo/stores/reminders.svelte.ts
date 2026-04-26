/**
 * Reminders Store — Mutation-Only Service
 *
 * Reads via liveQuery (useAllReminders in queries.ts).
 * This store handles create and delete operations for task reminders.
 */

import { reminderTable } from '../collections';
import type { LocalReminder } from '../types';

export const remindersStore = {
	async createReminder(data: {
		taskId: string;
		minutesBefore: number;
		type?: 'push' | 'email' | 'both';
	}) {
		const newReminder: LocalReminder = {
			id: crypto.randomUUID(),
			taskId: data.taskId,
			minutesBefore: data.minutesBefore,
			type: data.type ?? 'push',
			status: 'pending',
		};
		await reminderTable.add(newReminder);
		return newReminder;
	},

	async deleteReminder(id: string) {
		await reminderTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	async deleteRemindersForTask(taskId: string) {
		const reminders = await reminderTable.where('taskId').equals(taskId).toArray();
		for (const r of reminders) {
			if (!r.deletedAt) {
				await reminderTable.update(r.id, {
					deletedAt: new Date().toISOString(),
				});
			}
		}
	},

	async replaceReminder(
		taskId: string,
		minutesBefore: number | null,
		type?: 'push' | 'email' | 'both'
	) {
		// Delete existing
		await this.deleteRemindersForTask(taskId);

		// Create new if set
		if (minutesBefore != null) {
			return this.createReminder({ taskId, minutesBefore, type });
		}
		return null;
	},
};
