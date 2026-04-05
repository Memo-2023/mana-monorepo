/**
 * Habits Store — Mutation-Only Service
 *
 * Creates a TimeBlock for each habit log (point-event or with duration).
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { habitTable, habitLogTable } from '../collections';
import { toHabit } from '../queries';
import {
	createBlock,
	deleteBlock,
	updateBlock,
	startFromScheduled,
} from '$lib/data/time-blocks/service';
import { timeBlockTable } from '$lib/data/time-blocks/collections';
import {
	habitScheduleToRRule,
	materializeRecurringBlocks,
	regenerateForBlock,
} from '$lib/data/time-blocks/recurrence';
import { db } from '$lib/data/database';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
import type { LocalHabit, LocalHabitLog, HabitSchedule } from '../types';

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

	/**
	 * Set or clear a recurring schedule for a habit.
	 * Creates/updates a template TimeBlock with an RRULE for the unified recurrence engine.
	 */
	async setSchedule(habitId: string, schedule: HabitSchedule | null) {
		const habit = await habitTable.get(habitId);
		if (!habit) return;

		// Update the habit record
		await habitTable.update(habitId, {
			schedule,
			updatedAt: new Date().toISOString(),
		});

		// Find existing template block for this habit
		const existingTemplate = (await timeBlockTable.toArray()).find(
			(b) =>
				b.sourceModule === 'habits' &&
				b.sourceId === habitId &&
				b.recurrenceRule &&
				!b.parentBlockId &&
				!b.deletedAt
		);

		if (schedule) {
			const rrule = habitScheduleToRRule(schedule);
			const startTime = schedule.time ?? '09:00';
			const now = new Date();
			const startISO = `${now.toISOString().split('T')[0]}T${startTime}:00`;
			const durationMs = habit.defaultDuration ? habit.defaultDuration * 1000 : 3600000;
			const endISO = new Date(new Date(startISO).getTime() + durationMs).toISOString();

			if (existingTemplate) {
				// Update existing template
				await updateBlock(existingTemplate.id, {
					recurrenceRule: rrule,
					startDate: startISO,
					endDate: endISO,
					allDay: !schedule.time,
					title: habit.title,
					color: habit.color,
					icon: habit.icon,
				});
				await regenerateForBlock(existingTemplate.id);
			} else {
				// Create new template block
				const templateId = await createBlock({
					startDate: startISO,
					endDate: endISO,
					allDay: !schedule.time,
					recurrenceRule: rrule,
					kind: 'scheduled',
					type: 'habit',
					sourceModule: 'habits',
					sourceId: habitId,
					title: habit.title,
					color: habit.color,
					icon: habit.icon,
				});
				await materializeRecurringBlocks(30);
			}
		} else if (existingTemplate) {
			// Schedule cleared — delete template and all instances
			const { deleteAllInstances } = await import('$lib/data/time-blocks/recurrence');
			await deleteAllInstances(existingTemplate.id);
			await deleteBlock(existingTemplate.id);
		}
	},

	/**
	 * Generate scheduled TimeBlocks for habits using the unified recurrence engine.
	 * Delegates to materializeRecurringBlocks() which handles all recurring templates.
	 */
	async generateScheduledBlocks(daysAhead = 30) {
		await materializeRecurringBlocks(daysAhead);
	},

	/**
	 * Log a habit from a scheduled block (plan → reality).
	 * Creates a logged TimeBlock linked to the scheduled one.
	 */
	async logFromScheduled(scheduledBlockId: string, habitId: string, note?: string) {
		const loggedBlockId = await startFromScheduled(scheduledBlockId);

		const newLog: LocalHabitLog = {
			id: crypto.randomUUID(),
			habitId,
			timeBlockId: loggedBlockId,
			note: note ?? null,
		};

		await habitLogTable.add(newLog);
		return newLog;
	},
};
