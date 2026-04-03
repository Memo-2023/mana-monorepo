/**
 * Habits Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations.
 */

import { habitTable, habitLogTable } from '../collections';
import { toHabit } from '../queries';
import type { LocalHabit, LocalHabitLog } from '../types';

export const habitsStore = {
	async createHabit(data: {
		title: string;
		icon: string;
		color: string;
		targetPerDay?: number | null;
	}) {
		const existing = await habitTable.toArray();
		const count = existing.filter((h) => !h.deletedAt).length;

		const newLocal: LocalHabit = {
			id: crypto.randomUUID(),
			title: data.title,
			icon: data.icon,
			color: data.color,
			targetPerDay: data.targetPerDay ?? null,
			order: count,
			isArchived: false,
		};

		await habitTable.add(newLocal);
		return toHabit(newLocal);
	},

	async updateHabit(
		id: string,
		data: Partial<
			Pick<LocalHabit, 'title' | 'icon' | 'color' | 'targetPerDay' | 'isArchived' | 'order'>
		>
	) {
		await habitTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteHabit(id: string) {
		await habitTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		// Also soft-delete all logs for this habit
		const logs = await habitLogTable.where('habitId').equals(id).toArray();
		const now = new Date().toISOString();
		for (const log of logs) {
			await habitLogTable.update(log.id, { deletedAt: now });
		}
	},

	async logHabit(habitId: string, note?: string) {
		const newLog: LocalHabitLog = {
			id: crypto.randomUUID(),
			habitId,
			timestamp: new Date().toISOString(),
			note: note ?? null,
		};

		await habitLogTable.add(newLog);
		return newLog;
	},

	async deleteLog(logId: string) {
		await habitLogTable.update(logId, {
			deletedAt: new Date().toISOString(),
		});
	},

	async undoLastLog(habitId: string) {
		const logs = await habitLogTable.where('habitId').equals(habitId).toArray();
		const active = logs
			.filter((l) => !l.deletedAt)
			.sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
		if (active.length > 0) {
			await habitLogTable.update(active[0].id, {
				deletedAt: new Date().toISOString(),
			});
		}
	},

	async reorderHabits(habitIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < habitIds.length; i++) {
			await habitTable.update(habitIds[i], {
				order: i,
				updatedAt: now,
			});
		}
	},
};
