/**
 * Tasks Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in task-queries.ts.
 * This store only provides write operations (create, update, delete, etc.).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import type { Task, TaskPriority, TaskStatus, Subtask } from '@todo/shared';
import { taskCollection, type LocalTask } from '$lib/data/local-store';
import { toTask } from '$lib/data/task-queries';
import { TodoEvents } from '@manacore/shared-utils/analytics';

let error = $state<string | null>(null);

export const tasksStore = {
	get error() {
		return error;
	},

	async createTask(data: {
		title: string;
		description?: string;
		projectId?: string;
		dueDate?: string;
		priority?: TaskPriority;
		labelIds?: string[];
		subtasks?: Subtask[];
		recurrenceRule?: string;
	}) {
		error = null;
		try {
			const count = await taskCollection.count();
			const newLocal: LocalTask = {
				id: crypto.randomUUID(),
				title: data.title,
				description: data.description,
				projectId: data.projectId ?? null,
				priority: data.priority ?? 'medium',
				isCompleted: false,
				dueDate: data.dueDate ?? null,
				order: count,
				recurrenceRule: data.recurrenceRule ?? null,
				subtasks: data.subtasks,
			};

			const inserted = await taskCollection.insert(newLocal);
			TodoEvents.taskCreated(!!data.dueDate);
			return toTask(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create task';
			console.error('Failed to create task:', e);
			throw e;
		}
	},

	async updateTask(
		id: string,
		data: {
			title?: string;
			description?: string | null;
			projectId?: string | null;
			parentTaskId?: string | null;
			dueDate?: string | null;
			dueTime?: string | null;
			startDate?: string | null;
			priority?: TaskPriority;
			status?: TaskStatus;
			isCompleted?: boolean;
			order?: number;
			subtasks?: Subtask[] | null;
			recurrenceRule?: string | null;
			recurrenceEndDate?: string | null;
			metadata?: { [key: string]: unknown } | null;
			labelIds?: string[];
		}
	) {
		error = null;
		try {
			const updated = await taskCollection.update(id, data as Partial<LocalTask>);
			if (updated) {
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update task';
			console.error('Failed to update task:', e);
			throw e;
		}
	},

	async updateTaskOptimistic(
		id: string,
		data: {
			dueDate?: string | null;
			isCompleted?: boolean;
		}
	) {
		const updateData: Partial<LocalTask> = {};
		if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
		if (data.isCompleted !== undefined) {
			updateData.isCompleted = data.isCompleted;
			updateData.completedAt = data.isCompleted ? new Date().toISOString() : null;
		}

		await taskCollection.update(id, updateData);
	},

	async deleteTask(id: string) {
		error = null;
		try {
			await taskCollection.delete(id);
			TodoEvents.taskDeleted();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete task';
			console.error('Failed to delete task:', e);
			throw e;
		}
	},

	async completeTask(id: string) {
		error = null;
		try {
			const updated = await taskCollection.update(id, {
				isCompleted: true,
				completedAt: new Date().toISOString(),
			} as Partial<LocalTask>);
			if (updated) {
				TodoEvents.taskCompleted();
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to complete task';
			console.error('Failed to complete task:', e);
			throw e;
		}
	},

	async uncompleteTask(id: string) {
		error = null;
		try {
			const updated = await taskCollection.update(id, {
				isCompleted: false,
				completedAt: null,
			} as Partial<LocalTask>);
			if (updated) {
				TodoEvents.taskUncompleted();
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to uncomplete task';
			console.error('Failed to uncomplete task:', e);
			throw e;
		}
	},

	async moveTask(id: string, projectId: string | null) {
		error = null;
		try {
			const updated = await taskCollection.update(id, { projectId } as Partial<LocalTask>);
			if (updated) {
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to move task';
			console.error('Failed to move task:', e);
			throw e;
		}
	},

	async updateLabels(id: string, labelIds: string[]) {
		error = null;
		try {
			const updated = await taskCollection.update(id, {
				metadata: { labelIds },
			} as Partial<LocalTask>);
			if (updated) {
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update labels';
			console.error('Failed to update labels:', e);
			throw e;
		}
	},

	async updateSubtasks(id: string, subtasks: Subtask[]) {
		error = null;
		try {
			const updated = await taskCollection.update(id, { subtasks } as Partial<LocalTask>);
			if (updated) {
				return toTask(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update subtasks';
			console.error('Failed to update subtasks:', e);
			throw e;
		}
	},

	async reorderTasks(taskIds: string[]) {
		error = null;
		try {
			for (let i = 0; i < taskIds.length; i++) {
				await taskCollection.update(taskIds[i], { order: i } as Partial<LocalTask>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder tasks';
			console.error('Failed to reorder tasks:', e);
		}
	},

	isDemoTask(_taskId: string) {
		return false;
	},
};
