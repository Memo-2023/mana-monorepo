/**
 * Kanban Store - Manages kanban boards, columns, and tasks using Svelte 5 runes
 */

import type { KanbanBoard, KanbanColumn, Task } from '@todo/shared';
import * as kanbanApi from '$lib/api/kanban';
import * as tasksApi from '$lib/api/tasks';

// Board state
let boards = $state<KanbanBoard[]>([]);
let currentBoardId = $state<string | null>(null);

// Column & Task state
let columns = $state<KanbanColumn[]>([]);
let tasksByColumn = $state<Record<string, Task[]>>({});

// Loading & Error state
let loading = $state(false);
let boardsLoading = $state(false);
let error = $state<string | null>(null);

export const kanbanStore = {
	// =====================
	// Board Getters
	// =====================

	get boards() {
		return boards;
	},
	get currentBoardId() {
		return currentBoardId;
	},
	get currentBoard() {
		return boards.find((b) => b.id === currentBoardId) ?? null;
	},
	get globalBoard() {
		return boards.find((b) => b.isGlobal) ?? null;
	},

	// =====================
	// Column & Task Getters
	// =====================

	get columns() {
		return columns;
	},
	get tasksByColumn() {
		return tasksByColumn;
	},
	get loading() {
		return loading;
	},
	get boardsLoading() {
		return boardsLoading;
	},
	get error() {
		return error;
	},

	// =====================
	// Board Operations
	// =====================

	/**
	 * Fetch all boards for the current user
	 */
	async fetchBoards() {
		boardsLoading = true;
		error = null;
		try {
			boards = await kanbanApi.getBoards();

			// If no current board selected, select global board or first board
			if (!currentBoardId && boards.length > 0) {
				const globalBoard = boards.find((b) => b.isGlobal);
				currentBoardId = globalBoard?.id ?? boards[0].id;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch boards';
			console.error('Failed to fetch boards:', e);
		} finally {
			boardsLoading = false;
		}
	},

	/**
	 * Get or create the global board
	 */
	async getOrCreateGlobalBoard() {
		error = null;
		try {
			const globalBoard = await kanbanApi.getGlobalBoard();

			// Update or add to boards list
			const existingIndex = boards.findIndex((b) => b.id === globalBoard.id);
			if (existingIndex >= 0) {
				boards[existingIndex] = globalBoard;
			} else {
				boards = [globalBoard, ...boards];
			}

			return globalBoard;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to get global board';
			console.error('Failed to get global board:', e);
			throw e;
		}
	},

	/**
	 * Select a board and load its data
	 */
	async selectBoard(boardId: string) {
		if (currentBoardId === boardId) return;

		currentBoardId = boardId;
		await this.fetchKanbanData(boardId);
	},

	/**
	 * Create a new board
	 */
	async createBoard(data: { name: string; projectId?: string; color?: string; icon?: string }) {
		error = null;
		try {
			const newBoard = await kanbanApi.createBoard(data);
			boards = [...boards, newBoard];
			return newBoard;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create board';
			console.error('Failed to create board:', e);
			throw e;
		}
	},

	/**
	 * Update a board
	 */
	async updateBoard(id: string, data: { name?: string; color?: string; icon?: string }) {
		error = null;
		try {
			const updated = await kanbanApi.updateBoard(id, data);
			boards = boards.map((b) => (b.id === id ? updated : b));
			return updated;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update board';
			console.error('Failed to update board:', e);
			throw e;
		}
	},

	/**
	 * Delete a board
	 */
	async deleteBoard(id: string) {
		error = null;
		try {
			await kanbanApi.deleteBoard(id);
			boards = boards.filter((b) => b.id !== id);

			// If deleted board was current, switch to global board
			if (currentBoardId === id) {
				const globalBoard = boards.find((b) => b.isGlobal);
				currentBoardId = globalBoard?.id ?? boards[0]?.id ?? null;
				if (currentBoardId) {
					await this.fetchKanbanData(currentBoardId);
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete board';
			console.error('Failed to delete board:', e);
			throw e;
		}
	},

	/**
	 * Reorder boards (optimistic update)
	 */
	async reorderBoards(boardIds: string[]) {
		error = null;
		const previousBoards = [...boards];
		try {
			// Optimistic update
			boards = boardIds
				.map((id) => boards.find((b) => b.id === id))
				.filter((b): b is KanbanBoard => b !== undefined);

			// Persist to server
			const updated = await kanbanApi.reorderBoards(boardIds);
			boards = updated;
		} catch (e) {
			// Rollback on error
			boards = previousBoards;
			error = e instanceof Error ? e.message : 'Failed to reorder boards';
			console.error('Failed to reorder boards:', e);
			throw e;
		}
	},

	// =====================
	// Column & Task Operations
	// =====================

	/**
	 * Fetch columns and tasks grouped by column for a board
	 */
	async fetchKanbanData(boardId: string) {
		loading = true;
		error = null;
		try {
			const data = await kanbanApi.getKanbanTasks(boardId);
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
	 * Fetch only columns for a board
	 */
	async fetchColumns(boardId: string) {
		loading = true;
		error = null;
		try {
			columns = await kanbanApi.getColumns(boardId);
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
		boardId: string;
		color?: string;
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
	async initializeDefaultColumns(boardId: string) {
		error = null;
		try {
			const newColumns = await kanbanApi.initializeColumns(boardId);
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
		boards = [];
		currentBoardId = null;
		columns = [];
		tasksByColumn = {};
		loading = false;
		boardsLoading = false;
		error = null;
	},
};
