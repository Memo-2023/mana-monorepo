/**
 * Tasks Store — Mutation-Only Service
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only provides write operations.
 */

import { taskTable } from '../collections';
import { toTask } from '../queries';
import type { LocalTask, TaskPriority, Subtask } from '../types';

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
	}) {
		const existing = await taskTable.toArray();
		const count = existing.filter((t) => !t.deletedAt).length;

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
		};

		// Set projectId if provided
		if (data.projectId !== undefined) {
			(newLocal as Record<string, unknown>).projectId = data.projectId;
		}

		await taskTable.add(newLocal);
		return toTask(newLocal);
	},

	async updateTask(
		id: string,
		data: Partial<
			Pick<
				LocalTask,
				| 'title'
				| 'description'
				| 'dueDate'
				| 'priority'
				| 'isCompleted'
				| 'order'
				| 'subtasks'
				| 'recurrenceRule'
				| 'estimatedDuration'
				| 'metadata'
			>
		>
	) {
		await taskTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteTask(id: string) {
		await taskTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async completeTask(id: string) {
		await taskTable.update(id, {
			isCompleted: true,
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
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

	async reorderTasks(taskIds: string[]) {
		for (let i = 0; i < taskIds.length; i++) {
			await taskTable.update(taskIds[i], {
				order: i,
				updatedAt: new Date().toISOString(),
			});
		}
	},
};
