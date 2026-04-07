/**
 * Todo Reminder Source — provides due reminders to the shared scheduler.
 *
 * Checks all pending reminders against their task's dueDate.
 * A reminder is due when: dueDate - minutesBefore <= now.
 */

import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { ReminderSource, DueReminder } from '@mana/shared-stores';
import type { LocalTask, LocalReminder } from './types';

export const todoReminderSource: ReminderSource = {
	id: 'todo',

	async checkDue(): Promise<DueReminder[]> {
		const reminders = await db.table<LocalReminder>('reminders').toArray();
		const pending = reminders.filter((r) => r.status === 'pending' && !r.deletedAt);
		if (pending.length === 0) return [];

		// task.title is encrypted on disk; the notification body uses the
		// plaintext title, so decrypt before mapping.
		const rawTasks = await db.table<LocalTask>('tasks').toArray();
		const tasks = await decryptRecords('tasks', rawTasks);
		const taskMap = new Map(tasks.map((t) => [t.id, t]));
		const now = Date.now();
		const due: DueReminder[] = [];

		for (const r of pending) {
			const task = taskMap.get(r.taskId);
			if (!task?.dueDate || task.isCompleted) continue;

			const triggerAt = new Date(task.dueDate).getTime() - r.minutesBefore * 60_000;
			if (triggerAt <= now) {
				due.push({
					id: r.id,
					title: task.title || 'Aufgabe fällig',
					body: r.minutesBefore > 0 ? `In ${formatMinutes(r.minutesBefore)}` : 'Jetzt fällig',
					tag: `todo-${r.id}`,
				});
			}
		}

		return due;
	},

	async markSent(reminderId: string): Promise<void> {
		await db.table('reminders').update(reminderId, {
			status: 'sent',
			updatedAt: new Date().toISOString(),
		});
	},
};

function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes} Minuten`;
	if (minutes === 60) return '1 Stunde';
	if (minutes < 1440) return `${Math.round(minutes / 60)} Stunden`;
	return `${Math.round(minutes / 1440)} Tag(e)`;
}
