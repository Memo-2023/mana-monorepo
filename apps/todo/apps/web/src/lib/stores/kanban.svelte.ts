/**
 * Kanban Store - Manages kanban board state using Svelte 5 runes
 */

import type { KanbanColumn, Task } from '@todo/shared';
import * as kanbanApi from '$lib/api/kanban';
import * as tasksApi from '$lib/api/tasks';

// State
let columns = $state<KanbanColumn[]>([]);
let tasksByColumn = $state<Record<string, Task[]>>({});
let loading = $state(false);
let error = $state<string | null>(null);

export const kanbanStore = {
	// Getters
	get columns() {
		return columns;
	},
	get tasksByColumn() {
		return tasksByColumn;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch columns and tasks grouped by column
	 */
	async fetchKanbanData(projectId?: string) {
		loading = true;
		error = null;
		try {
			const data = await kanbanApi.getKanbanTasks(projectId);
			columns = data.columns;
			tasksByColumn = data.tasksByColumn;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch kanban data';
			console.error('Failed to fetch kanban data:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch only columns
	 */
	async fetchColumns(projectId?: string) {
		loading = true;
		error = null;
		try {
			columns = await kanbanApi.getColumns(projectId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch columns';
			console.error('Failed to fetch columns:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Create a new column
	 */
	async createColumn(data: {
		name: string;
		color?: string;
		projectId?: string;
		defaultStatus?: string;
		autoComplete?: boolean;
	}) {
		error = null;
		try {
			const newColumn = await kanbanApi.createColumn(data);
			columns = [...columns, newColumn];
			tasksByColumn[newColumn.id] = [];
			return newColumn;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create column';
			console.error('Failed to create column:', e);
			throw e;
		}
	},

	/**
	 * Update a column
	 */
	async updateColumn(
		id: string,
		data: {
			name?: string;
			color?: string;
			defaultStatus?: string;
			autoComplete?: boolean;
		}
	) {
		error = null;
		try {
			const updated = await kanbanApi.updateColumn(id, data);
			columns = columns.map((c) => (c.id === id ? updated : c));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update column';
			console.error('Failed to update column:', e);
			throw e;
		}
	},

	/**
	 * Delete a column
	 */
	async deleteColumn(id: string) {
		error = null;
		try {
			await kanbanApi.deleteColumn(id);
			columns = columns.filter((c) => c.id !== id);
			delete tasksByColumn[id];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete column';
			console.error('Failed to delete column:', e);
			throw e;
		}
	},

	/**
	 * Reorder columns (optimistic update)
	 */
	async reorderColumns(columnIds: string[]) {
		error = null;
		const previousColumns = [...columns];
		try {
			// Optimistic update
			columns = columnIds
				.map((id) => columns.find((c) => c.id === id))
				.filter((c): c is KanbanColumn => c !== undefined);

			// Persist to server
			const updated = await kanbanApi.reorderColumns(columnIds);
			columns = updated;
		} catch (e) {
			// Rollback on error
			columns = previousColumns;
			error = e instanceof Error ? e.message : 'Failed to reorder columns';
			console.error('Failed to reorder columns:', e);
			throw e;
		}
	},

	/**
	 * Move task to a different column (optimistic update)
	 */
	async moveTaskToColumn(taskId: string, fromColumnId: string, toColumnId: string, order?: number) {
		error = null;
		const previousTasksByColumn = { ...tasksByColumn };

		try {
			// Find the task
			const task = tasksByColumn[fromColumnId]?.find((t) => t.id === taskId);
			if (!task) {
				throw new Error('Task not found');
			}

			// Optimistic update
			tasksByColumn[fromColumnId] = tasksByColumn[fromColumnId].filter((t) => t.id !== taskId);

			if (!tasksByColumn[toColumnId]) {
				tasksByColumn[toColumnId] = [];
			}

			const insertIndex = order ?? tasksByColumn[toColumnId].length;
			const updatedTask = { ...task, columnId: toColumnId, columnOrder: insertIndex };
			tasksByColumn[toColumnId] = [
				...tasksByColumn[toColumnId].slice(0, insertIndex),
				updatedTask,
				...tasksByColumn[toColumnId].slice(insertIndex),
			];

			// Persist to server
			await kanbanApi.moveTaskToColumn(taskId, toColumnId, order);
		} catch (e) {
			// Rollback on error
			tasksByColumn = previousTasksByColumn;
			error = e instanceof Error ? e.message : 'Failed to move task';
			console.error('Failed to move task:', e);
			throw e;
		}
	},

	/**
	 * Reorder tasks within a column (optimistic update)
	 */
	async reorderTasksInColumn(columnId: string, taskIds: string[]) {
		error = null;
		const previousTasks = [...(tasksByColumn[columnId] || [])];

		try {
			// Optimistic update
			const columnTasks = tasksByColumn[columnId] || [];
			tasksByColumn[columnId] = taskIds
				.map((id) => columnTasks.find((t) => t.id === id))
				.filter((t): t is Task => t !== undefined);

			// Persist to server
			await kanbanApi.reorderTasksInColumn(columnId, taskIds);
		} catch (e) {
			// Rollback on error
			tasksByColumn[columnId] = previousTasks;
			error = e instanceof Error ? e.message : 'Failed to reorder tasks';
			console.error('Failed to reorder tasks:', e);
			throw e;
		}
	},

	/**
	 * Initialize default columns if none exist
	 */
	async initializeDefaultColumns(projectId?: string) {
		error = null;
		try {
			const newColumns = await kanbanApi.initializeColumns(projectId);
			columns = newColumns;
			// Initialize empty task arrays for each column
			for (const col of newColumns) {
				if (!tasksByColumn[col.id]) {
					tasksByColumn[col.id] = [];
				}
			}
			return newColumns;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to initialize columns';
			console.error('Failed to initialize columns:', e);
			throw e;
		}
	},

	/**
	 * Get tasks for a specific column
	 */
	getTasksForColumn(columnId: string): Task[] {
		return tasksByColumn[columnId] || [];
	},

	/**
	 * Create a new task in a specific column
	 */
	async createTaskInColumn(columnId: string, title: string, projectId?: string) {
		error = null;
		try {
			// Find the column to get its default status
			const column = columns.find((c) => c.id === columnId);
			const status = column?.defaultStatus || 'pending';

			// Create the task
			const newTask = await tasksApi.createTask({
				title,
				projectId,
				priority: 'medium',
			});

			// Move task to the column (this will set columnId and status)
			const movedTask = await kanbanApi.moveTaskToColumn(newTask.id, columnId, 0);

			// Add to local state at the beginning of the column
			if (!tasksByColumn[columnId]) {
				tasksByColumn[columnId] = [];
			}
			tasksByColumn[columnId] = [movedTask, ...tasksByColumn[columnId]];

			return movedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create task';
			console.error('Failed to create task in column:', e);
			throw e;
		}
	},

	/**
	 * Clear all state (for logout)
	 */
	clear() {
		columns = [];
		tasksByColumn = {};
		loading = false;
		error = null;
	},
};
