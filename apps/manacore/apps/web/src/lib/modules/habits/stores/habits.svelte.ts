/**
 * Habits Store — Mutation-Only Service
 *
 * Creates a TimeBlock for each habit log (point-event or with duration).
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { habitTable, habitLogTable } from '../collections';
import { toHabit } from '../queries';
import { createBlock, deleteBlock } from '$lib/data/time-blocks/service';
import type { LocalHabit, LocalHabitLog } from '../types';

export const habitsStore = {
	async createHabit(data: {
		title: string;
		icon: string;
		color: string;
		targetPerDay?: number | null;
		defaultDuration?: number | null;
	}) {
		const existing = await habitTable.toArray();
		const count = existing.filter((h) => !h.deletedAt).length;

		const newLocal: LocalHabit = {
			id: crypto.randomUUID(),
			title: data.title,
			icon: data.icon,
			color: data.color,
			targetPerDay: data.targetPerDay ?? null,
			defaultDuration: data.defaultDuration ?? null,
			order: count,
			isArchived: false,
		};

		await habitTable.add(newLocal);
		return toHabit(newLocal);
	},

	async updateHabit(
		id: string,
		data: Partial<
			Pick<
				LocalHabit,
				'title' | 'icon' | 'color' | 'targetPerDay' | 'defaultDuration' | 'isArchived' | 'order'
			>
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
		// Also soft-delete all logs and their timeBlocks
		const logs = await habitLogTable.where('habitId').equals(id).toArray();
		const now = new Date().toISOString();
		for (const log of logs) {
			if (log.timeBlockId) {
				await deleteBlock(log.timeBlockId);
			}
			await habitLogTable.update(log.id, { deletedAt: now });
		}
	},

	async logHabit(habitId: string, note?: string) {
		const habit = await habitTable.get(habitId);
		const now = new Date();
		const logId = crypto.randomUUID();

		// Calculate endDate if habit has a default duration
		const endDate = habit?.defaultDuration
			? new Date(now.getTime() + habit.defaultDuration * 1000).toISOString()
			: null;

		// 1. Create TimeBlock (point-event or with duration)
		const timeBlockId = await createBlock({
			startDate: now.toISOString(),
			endDate,
			kind: 'logged',
			type: 'habit',
			sourceModule: 'habits',
			sourceId: logId,
			title: habit?.title ?? 'Habit',
			color: habit?.color ?? null,
			icon: habit?.icon ?? null,
		});

		// 2. Create HabitLog
		const newLog: LocalHabitLog = {
			id: logId,
			habitId,
			timeBlockId,
			note: note ?? null,
		};

		await habitLogTable.add(newLog);
		return newLog;
	},

	async deleteLog(logId: string) {
		const log = await habitLogTable.get(logId);
		if (log?.timeBlockId) {
			await deleteBlock(log.timeBlockId);
		}
		await habitLogTable.update(logId, {
			deletedAt: new Date().toISOString(),
		});
	},

	async undoLastLog(habitId: string) {
		const logs = await habitLogTable.where('habitId').equals(habitId).toArray();
		const active = logs
			.filter((l) => !l.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		if (active.length > 0) {
			const log = active[0];
			if (log.timeBlockId) {
				await deleteBlock(log.timeBlockId);
			}
			await habitLogTable.update(log.id, {
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
