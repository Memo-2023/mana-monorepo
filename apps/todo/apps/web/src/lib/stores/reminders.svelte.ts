/**
 * Reminders Store — Local-First CRUD for task reminders
 *
 * Manages reminders in IndexedDB via the reminderCollection.
 * Syncs to server in the background via mana-sync.
 */

import { reminderCollection, type LocalReminder } from '$lib/data/local-store';
import { TodoEvents } from '@manacore/shared-utils/analytics';
import { withErrorHandling } from './store-helpers';

let error = $state<string | null>(null);
const setError = (e: string | null) => (error = e);

export const remindersStore = {
	get error() {
		return error;
	},

	async createReminder(
		taskId: string,
		minutesBefore: number,
		type: 'push' | 'email' | 'both' = 'push'
	) {
		return withErrorHandling(
			setError,
			async () => {
				const reminder: LocalReminder = {
					id: crypto.randomUUID(),
					taskId,
					minutesBefore,
					type,
					status: 'pending',
				};
				const inserted = await reminderCollection.insert(reminder);
				TodoEvents.reminderCreated(minutesBefore === 0 ? 'absolute' : 'relative');
				return inserted;
			},
			'Failed to create reminder'
		);
	},

	async deleteReminder(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				await reminderCollection.delete(id);
			},
			'Failed to delete reminder'
		);
	},

	async deleteByTaskId(taskId: string) {
		return withErrorHandling(
			setError,
			async () => {
				const all = await reminderCollection.getAll();
				const forTask = all.filter((r) => r.taskId === taskId);
				for (const r of forTask) {
					await reminderCollection.delete(r.id);
				}
			},
			'Failed to delete reminders',
			{ rethrow: false }
		);
	},
};
