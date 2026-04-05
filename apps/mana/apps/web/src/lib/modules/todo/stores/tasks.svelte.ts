/**
 * Tasks Store — Mutation-Only Service
 *
 * When a task is scheduled on the calendar, a TimeBlock is created.
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { taskTable } from '../collections';
import { toTask } from '../queries';
import type { LocalTask, TaskPriority, Subtask } from '../types';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import { TodoEvents } from '@mana/shared-utils/analytics';

export const tasksStore = {
	async createTask(data: {
		title: string;
		description?: string;
		dueDate?: string;
		priority?: TaskPriority;
		projectId?: string | null;
		subtasks?: Subtask[];
		recurrenceRule?: string;
		estimatedDuration?: number;
		// Optional: schedule on calendar
		scheduleStartDate?: string; // YYYY-MM-DD
		scheduleStartTime?: string; // HH:mm
	}) {
		const existing = await taskTable.toArray();
		const count = existing.filter((t) => !t.deletedAt).length;
		const taskId = crypto.randomUUID();

		let scheduledBlockId: string | null = null;

		// Create TimeBlock if scheduling on calendar
		if (data.scheduleStartDate) {
			const startISO = data.scheduleStartTime
				? `${data.scheduleStartDate}T${data.scheduleStartTime}:00`
				: `${data.scheduleStartDate}T09:00:00`;
			const durationMs = data.estimatedDuration ? data.estimatedDuration * 1000 : 3600000;
			const endISO = new Date(new Date(startISO).getTime() + durationMs).toISOString();

			scheduledBlockId = await createBlock({
				startDate: startISO,
				endDate: endISO,
				allDay: !data.scheduleStartTime,
				kind: 'scheduled',
				type: 'task',
				sourceModule: 'todo',
				sourceId: taskId,
				title: data.title,
				projectId: data.projectId ?? null,
			});
		}

		const newLocal: LocalTask = {
			id: taskId,
			title: data.title,
			description: data.description,
			priority: data.priority ?? 'medium',
			isCompleted: false,
			dueDate: data.dueDate ?? null,
			scheduledBlockId,
			estimatedDuration: data.estimatedDuration ?? null,
			order: count,
			recurrenceRule: data.recurrenceRule ?? null,
			subtasks: data.subtasks,
		};

		if (data.projectId !== undefined) {
			(newLocal as Record<string, unknown>).projectId = data.projectId;
		}

		await taskTable.add(newLocal);
		TodoEvents.taskCreated(!!data.dueDate);
		return toTask(newLocal);
	},

	async updateTask(id: string, data: Record<string, unknown>) {
		const task = await taskTable.get(id);
		if (!task) return;

		// Handle schedule changes via TimeBlock
		const schedStartDate = data._scheduleStartDate as string | null | undefined;
		const schedStartTime = data._scheduleStartTime as string | null | undefined;
		delete data._scheduleStartDate;
		delete data._scheduleStartTime;

		if (schedStartDate !== undefined) {
			if (schedStartDate) {
				// Schedule or reschedule
				const startISO = schedStartTime
					? `${schedStartDate}T${schedStartTime}:00`
					: `${schedStartDate}T09:00:00`;
				const estDuration =
					(data.estimatedDuration as number | undefined) ?? task.estimatedDuration;
				const durationMs = estDuration ? estDuration * 1000 : 3600000;
				const endISO = new Date(new Date(startISO).getTime() + durationMs).toISOString();

				if (task.scheduledBlockId) {
					// Update existing block
					await updateBlock(task.scheduledBlockId, {
						startDate: startISO,
						endDate: endISO,
						allDay: !schedStartTime,
						title: (data.title as string) ?? task.title,
					});
				} else {
					// Create new block
					const blockId = await createBlock({
						startDate: startISO,
						endDate: endISO,
						allDay: !schedStartTime,
						kind: 'scheduled',
						type: 'task',
						sourceModule: 'todo',
						sourceId: id,
						title: (data.title as string) ?? task.title,
						projectId: (data.projectId as string) ?? task.projectId ?? null,
					});
					data.scheduledBlockId = blockId;
				}
			} else {
				// Unschedule: delete the TimeBlock
				if (task.scheduledBlockId) {
					await deleteBlock(task.scheduledBlockId);
					data.scheduledBlockId = null;
				}
			}
		}

		// Keep TimeBlock title in sync if title changed
		if (data.title !== undefined && task.scheduledBlockId && schedStartDate === undefined) {
			await updateBlock(task.scheduledBlockId, { title: data.title as string });
		}

		await taskTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
		TodoEvents.taskEdited();
	},

	async deleteTask(id: string) {
		const task = await taskTable.get(id);
		if (task?.scheduledBlockId) {
			await deleteBlock(task.scheduledBlockId);
		}

		await taskTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		TodoEvents.taskDeleted();
	},

	async completeTask(id: string) {
		await taskTable.update(id, {
			isCompleted: true,
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		TodoEvents.taskCompleted();
	},

	async uncompleteTask(id: string) {
		await taskTable.update(id, {
			isCompleted: false,
			completedAt: null,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleComplete(id: string) {
		const task = await taskTable.get(id);
		if (!task) return;

		if (task.isCompleted) {
			await this.uncompleteTask(id);
		} else {
			await this.completeTask(id);
		}
	},

	async updateSubtasks(id: string, subtasks: Subtask[]) {
		await taskTable.update(id, {
			subtasks,
			updatedAt: new Date().toISOString(),
		});
	},

	async updateLabels(id: string, labelIds: string[]) {
		const existing = await taskTable.get(id);
		const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
		await taskTable.update(id, {
			metadata: { ...existingMeta, labelIds },
			updatedAt: new Date().toISOString(),
		});
	},

	async reorderTasks(taskIds: string[]) {
		for (let i = 0; i < taskIds.length; i++) {
			await taskTable.update(taskIds[i], {
				order: i,
				updatedAt: new Date().toISOString(),
			});
		}
	},
};
