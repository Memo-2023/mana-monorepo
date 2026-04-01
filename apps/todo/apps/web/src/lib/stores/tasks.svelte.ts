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
import { withErrorHandling } from './store-helpers';

let error = $state<string | null>(null);
const setError = (e: string | null) => (error = e);

export const tasksStore = {
	get error() {
		return error;
	},

	async createTask(data: {
		title: string;
		description?: string;
		dueDate?: string;
		priority?: TaskPriority;
		labelIds?: string[];
		subtasks?: Subtask[];
		recurrenceRule?: string;
		estimatedDuration?: number;
	}) {
		return withErrorHandling(
			setError,
			async () => {
				const count = await taskCollection.count();
				const newLocal: LocalTask = {
					id: crypto.randomUUID(),
					title: data.title,
					description: data.description,
					priority: data.priority ?? 'medium',
					isCompleted: false,
					dueDate: data.dueDate ?? null,
					estimatedDuration: data.estimatedDuration ?? null,
					order: count,
					recurrenceRule: data.recurrenceRule ?? null,
					subtasks: data.subtasks,
					...(data.labelIds?.length && { metadata: { labelIds: data.labelIds } }),
				};

				const inserted = await taskCollection.insert(newLocal);
				TodoEvents.taskCreated(!!data.dueDate);
				if (data.recurrenceRule) TodoEvents.recurringTaskCreated(data.recurrenceRule);
				return toTask(inserted);
			},
			'Failed to create task'
		);
	},

	async updateTask(
		id: string,
		data: {
			title?: string;
			description?: string | null;
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
		return withErrorHandling(
			setError,
			async () => {
				const updated = await taskCollection.update(id, data as Partial<LocalTask>);
				if (updated) {
					if (data.priority !== undefined) TodoEvents.priorityChanged(data.priority);
					if (data.dueDate !== undefined) TodoEvents.dueDateSet();
					if (data.recurrenceRule !== undefined && data.recurrenceRule) {
						TodoEvents.recurringTaskCreated(data.recurrenceRule);
					}
					return toTask(updated);
				}
			},
			'Failed to update task'
		);
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
		return withErrorHandling(
			setError,
			async () => {
				await taskCollection.delete(id);
				TodoEvents.taskDeleted();
			},
			'Failed to delete task'
		);
	},

	async completeTask(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				const updated = await taskCollection.update(id, {
					isCompleted: true,
					completedAt: new Date().toISOString(),
				} as Partial<LocalTask>);
				if (updated) {
					TodoEvents.taskCompleted();
					return toTask(updated);
				}
			},
			'Failed to complete task'
		);
	},

	async uncompleteTask(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				const updated = await taskCollection.update(id, {
					isCompleted: false,
					completedAt: null,
				} as Partial<LocalTask>);
				if (updated) {
					TodoEvents.taskUncompleted();
					return toTask(updated);
				}
			},
			'Failed to uncomplete task'
		);
	},

	async updateLabels(id: string, labelIds: string[]) {
		return withErrorHandling(
			setError,
			async () => {
				const existing = await taskCollection.get(id);
				const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};
				const updated = await taskCollection.update(id, {
					metadata: { ...existingMeta, labelIds },
				} as Partial<LocalTask>);
				if (updated) {
					return toTask(updated);
				}
			},
			'Failed to update labels'
		);
	},

	async updateSubtasks(id: string, subtasks: Subtask[]) {
		return withErrorHandling(
			setError,
			async () => {
				const updated = await taskCollection.update(id, { subtasks } as Partial<LocalTask>);
				if (updated) {
					return toTask(updated);
				}
			},
			'Failed to update subtasks'
		);
	},

	async reorderTasks(taskIds: string[]) {
		return withErrorHandling(
			setError,
			async () => {
				for (let i = 0; i < taskIds.length; i++) {
					await taskCollection.update(taskIds[i], { order: i } as Partial<LocalTask>);
				}
				TodoEvents.taskReordered();
			},
			'Failed to reorder tasks',
			{ rethrow: false }
		);
	},

	isDemoTask(_taskId: string) {
		return false;
	},
};
