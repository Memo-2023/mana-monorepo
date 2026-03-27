/**
 * Tasks Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import type { Task, TaskPriority, TaskStatus, Subtask } from '@todo/shared';
import { taskCollection, type LocalTask } from '$lib/data/local-store';
import { isToday, isPast, isFuture, startOfDay, addDays } from 'date-fns';
import { TodoEvents } from '@manacore/shared-utils/analytics';

// State — populated from IndexedDB
let tasks = $state<Task[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalTask (IndexedDB record) to the shared Task type. */
function toTask(local: LocalTask): Task {
	return {
		id: local.id,
		projectId: local.projectId,
		userId: local.userId ?? 'guest',
		title: local.title,
		description: local.description,
		dueDate: local.dueDate,
		scheduledDate: local.scheduledDate,
		scheduledStartTime: local.scheduledStartTime,
		estimatedDuration: local.estimatedDuration,
		priority: local.priority,
		status: local.isCompleted ? 'completed' : 'pending',
		isCompleted: local.isCompleted,
		completedAt: local.completedAt,
		order: local.order,
		recurrenceRule: local.recurrenceRule,
		subtasks: local.subtasks ?? null,
		metadata: local.metadata as Task['metadata'],
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Load tasks from IndexedDB into the reactive state. */
async function refreshTasks(filter?: Partial<LocalTask>) {
	const localTasks = await taskCollection.getAll(filter, { sortBy: 'order', sortDirection: 'asc' });
	tasks = localTasks.map(toTask);
}

export const tasksStore = {
	// Getters
	get tasks() {
		return tasks;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	get incompleteTasks() {
		return tasks.filter((t) => !t.isCompleted);
	},

	get completedTasks() {
		return tasks.filter((t) => t.isCompleted);
	},

	/**
	 * Fetch tasks with optional filters — reads from IndexedDB.
	 */
	async fetchTasks(
		query: {
			projectId?: string;
			labelId?: string;
			priority?: TaskPriority;
			status?: TaskStatus;
			dueBefore?: string;
			dueAfter?: string;
			isCompleted?: boolean;
			search?: string;
		} = {}
	) {
		loading = true;
		error = null;
		try {
			const filter: Partial<LocalTask> = {};
			if (query.projectId) filter.projectId = query.projectId;
			if (query.priority) filter.priority = query.priority;
			if (query.isCompleted !== undefined) filter.isCompleted = query.isCompleted;

			let localTasks = await taskCollection.getAll(
				Object.keys(filter).length > 0 ? filter : undefined,
				{ sortBy: 'order', sortDirection: 'asc' }
			);

			// Client-side search filter
			if (query.search) {
				const search = query.search.toLowerCase();
				localTasks = localTasks.filter(
					(t) =>
						t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search)
				);
			}

			tasks = localTasks.map(toTask);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch tasks';
			console.error('Failed to fetch tasks:', e);
		} finally {
			loading = false;
		}
	},

	async fetchInboxTasks() {
		loading = true;
		error = null;
		try {
			const localTasks = await taskCollection.getAll(undefined, {
				sortBy: 'order',
				sortDirection: 'asc',
			});
			// Inbox = tasks without projectId or with null projectId
			tasks = localTasks.filter((t) => !t.projectId).map(toTask);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch inbox tasks';
		} finally {
			loading = false;
		}
	},

	async fetchTodayTasks() {
		loading = true;
		error = null;
		try {
			const localTasks = await taskCollection.getAll(
				{ isCompleted: false },
				{ sortBy: 'order', sortDirection: 'asc' }
			);
			const today = startOfDay(new Date());
			tasks = localTasks
				.filter((t) => {
					if (!t.dueDate) return false;
					const d = new Date(t.dueDate);
					return isToday(d) || (isPast(startOfDay(d)) && !isToday(d));
				})
				.map(toTask);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch today tasks';
		} finally {
			loading = false;
		}
	},

	async fetchUpcomingTasks() {
		loading = true;
		error = null;
		try {
			const localTasks = await taskCollection.getAll(
				{ isCompleted: false },
				{ sortBy: 'dueDate', sortDirection: 'asc' }
			);
			const today = startOfDay(new Date());
			const weekFromNow = addDays(today, 7);
			tasks = localTasks
				.filter((t) => {
					if (!t.dueDate) return false;
					const d = new Date(t.dueDate);
					return isFuture(d) && d <= weekFromNow;
				})
				.map(toTask);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch upcoming tasks';
		} finally {
			loading = false;
		}
	},

	async fetchAllTasks() {
		loading = true;
		error = null;
		try {
			await refreshTasks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch all tasks';
		} finally {
			loading = false;
		}
	},

	getTasksByProject(projectId: string | null): Task[] {
		if (projectId === null) {
			return tasks.filter((t) => !t.projectId);
		}
		return tasks.filter((t) => t.projectId === projectId);
	},

	getTasksByLabel(labelId: string): Task[] {
		return tasks.filter((t) => t.labels?.some((l) => l.id === labelId));
	},

	get overdueTasks(): Task[] {
		return tasks.filter((t) => {
			if (!t.dueDate || t.isCompleted) return false;
			const dueDate = new Date(t.dueDate);
			return isPast(startOfDay(dueDate)) && !isToday(dueDate);
		});
	},

	get todayTasks(): Task[] {
		const today = startOfDay(new Date());
		return tasks.filter((t) => {
			if (t.isCompleted) return false;
			if (!t.dueDate) return true;
			const taskDate = startOfDay(new Date(t.dueDate));
			return taskDate.getTime() === today.getTime();
		});
	},

	get upcomingTasks(): Task[] {
		const today = startOfDay(new Date());
		const weekFromNow = addDays(today, 7);
		return tasks.filter((t) => {
			if (!t.dueDate || t.isCompleted) return false;
			const dueDate = new Date(t.dueDate);
			return isFuture(dueDate) && dueDate <= weekFromNow;
		});
	},

	/**
	 * Create a new task — writes to IndexedDB instantly.
	 */
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
			const newLocal: LocalTask = {
				id: crypto.randomUUID(),
				title: data.title,
				description: data.description,
				projectId: data.projectId ?? null,
				priority: data.priority ?? 'medium',
				isCompleted: false,
				dueDate: data.dueDate ?? null,
				order: tasks.length,
				recurrenceRule: data.recurrenceRule ?? null,
				subtasks: data.subtasks,
			};

			const inserted = await taskCollection.insert(newLocal);
			const newTask = toTask(inserted);
			tasks = [...tasks, newTask];
			TodoEvents.taskCreated(!!data.dueDate);
			return newTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create task';
			console.error('Failed to create task:', e);
			throw e;
		}
	},

	/**
	 * Update a task — writes to IndexedDB instantly.
	 */
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
				const updatedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
				return updatedTask;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update task';
			console.error('Failed to update task:', e);
			throw e;
		}
	},

	/**
	 * Optimistic update — for drag-and-drop. Instant local write.
	 */
	async updateTaskOptimistic(
		id: string,
		data: {
			dueDate?: string | null;
			isCompleted?: boolean;
		}
	) {
		// Immediate local state update
		tasks = tasks.map((t) => (t.id === id ? { ...t, ...data } : t));

		// Persist to IndexedDB
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
			tasks = tasks.filter((t) => t.id !== id);
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
				const completedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? completedTask : t));
				TodoEvents.taskCompleted();
				return completedTask;
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
				const uncompletedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? uncompletedTask : t));
				TodoEvents.taskUncompleted();
				return uncompletedTask;
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
				const movedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? movedTask : t));
				return movedTask;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to move task';
			console.error('Failed to move task:', e);
			throw e;
		}
	},

	async updateLabels(id: string, labelIds: string[]) {
		// Labels are stored via the central tag system, not locally.
		// For now, update the task metadata to track label associations.
		error = null;
		try {
			const updated = await taskCollection.update(id, {
				metadata: { labelIds },
			} as Partial<LocalTask>);
			if (updated) {
				const updatedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
				return updatedTask;
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
				const updatedTask = toTask(updated);
				tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
				return updatedTask;
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
			// Update order in local state immediately
			tasks = tasks.map((t) => {
				const newOrder = taskIds.indexOf(t.id);
				return newOrder !== -1 ? { ...t, order: newOrder } : t;
			});

			// Persist each order change to IndexedDB
			for (let i = 0; i < taskIds.length; i++) {
				await taskCollection.update(taskIds[i], { order: i } as Partial<LocalTask>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder tasks';
			console.error('Failed to reorder tasks:', e);
		}
	},

	clear() {
		tasks = [];
		loading = false;
		error = null;
	},

	/**
	 * No longer relevant — all tasks are local and editable.
	 */
	isDemoTask(_taskId: string) {
		return false;
	},
};
