/**
 * Tasks Store - Manages task state using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import type { Task, TaskPriority, TaskStatus, Subtask } from '@todo/shared';
import * as tasksApi from '$lib/api/tasks';
import { isToday, isPast, isFuture, startOfDay, addDays } from 'date-fns';
import { sessionTasksStore } from './session-tasks.svelte';
import { authStore } from './auth.svelte';

// State
let tasks = $state<Task[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

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

	/**
	 * Get incomplete tasks
	 */
	get incompleteTasks() {
		return tasks.filter((t) => !t.isCompleted);
	},

	/**
	 * Get completed tasks
	 */
	get completedTasks() {
		return tasks.filter((t) => t.isCompleted);
	},

	/**
	 * Fetch tasks with optional filters
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
			tasks = await tasksApi.getTasks(query);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch tasks';
			console.error('Failed to fetch tasks:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch inbox tasks (tasks without project)
	 */
	async fetchInboxTasks() {
		loading = true;
		error = null;
		try {
			tasks = await tasksApi.getInboxTasks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch inbox tasks';
			console.error('Failed to fetch inbox tasks:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch today's tasks
	 */
	async fetchTodayTasks() {
		loading = true;
		error = null;
		try {
			tasks = await tasksApi.getTodayTasks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch today tasks';
			console.error('Failed to fetch today tasks:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch upcoming tasks
	 */
	async fetchUpcomingTasks() {
		loading = true;
		error = null;
		try {
			tasks = await tasksApi.getUpcomingTasks();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch upcoming tasks';
			console.error('Failed to fetch upcoming tasks:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch all tasks (incomplete + completed) for unified view
	 * In guest mode, only shows session tasks
	 */
	async fetchAllTasks() {
		loading = true;
		error = null;

		// Guest mode: load session tasks only
		if (!authStore.isAuthenticated) {
			sessionTasksStore.initialize();
			tasks = sessionTasksStore.tasks;
			loading = false;
			return;
		}

		// Authenticated: fetch from API
		try {
			// Fetch all tasks without filter - let frontend handle filtering
			const allTasks = await tasksApi.getTasks({});
			tasks = allTasks;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch all tasks';
			console.error('Failed to fetch all tasks:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Get tasks for a specific project
	 */
	getTasksByProject(projectId: string | null): Task[] {
		if (projectId === null) {
			return tasks.filter((t) => !t.projectId);
		}
		return tasks.filter((t) => t.projectId === projectId);
	},

	/**
	 * Get tasks with a specific label
	 */
	getTasksByLabel(labelId: string): Task[] {
		return tasks.filter((t) => t.labels?.some((l) => l.id === labelId));
	},

	/**
	 * Get overdue tasks
	 */
	get overdueTasks(): Task[] {
		return tasks.filter((t) => {
			if (!t.dueDate || t.isCompleted) return false;
			const dueDate = new Date(t.dueDate);
			return isPast(startOfDay(dueDate)) && !isToday(dueDate);
		});
	},

	/**
	 * Get tasks due today
	 */
	get todayTasks(): Task[] {
		const today = startOfDay(new Date());
		return tasks.filter((t) => {
			if (t.isCompleted) return false;
			// Include tasks without dueDate as "today" tasks (inbox behavior)
			if (!t.dueDate) return true;
			const taskDate = startOfDay(new Date(t.dueDate));
			return taskDate.getTime() === today.getTime();
		});
	},

	/**
	 * Get tasks for next 7 days
	 */
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
	 * Create a new task
	 * If not authenticated, creates a session task (local only)
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

		// Guest mode: create session task
		if (!authStore.isAuthenticated) {
			const sessionTask = sessionTasksStore.createTask({
				title: data.title,
				description: data.description,
				projectId: data.projectId || 'session-inbox',
				dueDate: data.dueDate,
				priority: data.priority,
				subtasks: data.subtasks as Subtask[],
			});
			tasks = [...tasks, sessionTask];
			return sessionTask;
		}

		// Authenticated: create via API
		try {
			const newTask = await tasksApi.createTask(data);
			tasks = [...tasks, newTask];
			return newTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create task';
			console.error('Failed to create task:', e);
			throw e;
		}
	},

	/**
	 * Update an existing task
	 * Handles both session tasks (local) and cloud tasks
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

		// Session task: update locally
		if (sessionTasksStore.isSessionTask(id)) {
			const updated = sessionTasksStore.updateTask(id, data);
			if (updated) {
				tasks = tasks.map((t) => (t.id === id ? updated : t));
				return updated;
			}
			throw new Error('Task not found');
		}

		// Cloud task: update via API
		try {
			const updatedTask = await tasksApi.updateTask(id, data);
			tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
			return updatedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update task';
			console.error('Failed to update task:', e);
			throw e;
		}
	},

	/**
	 * Update task optimistically (for drag and drop)
	 * Updates local state immediately, then syncs with server
	 */
	async updateTaskOptimistic(
		id: string,
		data: {
			dueDate?: string | null;
			isCompleted?: boolean;
		}
	) {
		// Optimistic update - immediately update local state
		const originalTask = tasks.find((t) => t.id === id);
		if (!originalTask) return;

		tasks = tasks.map((t) => (t.id === id ? { ...t, ...data } : t));

		try {
			// Handle completion state change first
			if (data.isCompleted !== undefined && data.isCompleted !== originalTask.isCompleted) {
				if (data.isCompleted) {
					const updatedTask = await tasksApi.completeTask(id);
					tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
				} else {
					const updatedTask = await tasksApi.uncompleteTask(id);
					tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
				}
			}

			// Handle due date change
			if (data.dueDate !== undefined) {
				const updatedTask = await tasksApi.updateTask(id, { dueDate: data.dueDate });
				tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
			}
		} catch (e) {
			// Rollback on error
			console.error('Failed to update task:', e);
			tasks = tasks.map((t) => (t.id === id ? originalTask : t));
		}
	},

	/**
	 * Delete a task
	 * Handles both session tasks (local) and cloud tasks
	 */
	async deleteTask(id: string) {
		error = null;

		// Session task: delete locally
		if (sessionTasksStore.isSessionTask(id)) {
			sessionTasksStore.deleteTask(id);
			tasks = tasks.filter((t) => t.id !== id);
			return;
		}

		// Cloud task: delete via API
		try {
			await tasksApi.deleteTask(id);
			tasks = tasks.filter((t) => t.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete task';
			console.error('Failed to delete task:', e);
			throw e;
		}
	},

	/**
	 * Mark task as complete
	 * Handles both session tasks (local) and cloud tasks
	 */
	async completeTask(id: string) {
		error = null;

		// Session task: complete locally
		if (sessionTasksStore.isSessionTask(id)) {
			const completed = sessionTasksStore.completeTask(id);
			if (completed) {
				tasks = tasks.map((t) => (t.id === id ? completed : t));
				return completed;
			}
			throw new Error('Task not found');
		}

		// Cloud task: complete via API
		try {
			const completedTask = await tasksApi.completeTask(id);
			tasks = tasks.map((t) => (t.id === id ? completedTask : t));
			return completedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to complete task';
			console.error('Failed to complete task:', e);
			throw e;
		}
	},

	/**
	 * Mark task as incomplete
	 * Handles both session tasks (local) and cloud tasks
	 */
	async uncompleteTask(id: string) {
		error = null;

		// Session task: uncomplete locally
		if (sessionTasksStore.isSessionTask(id)) {
			const uncompleted = sessionTasksStore.uncompleteTask(id);
			if (uncompleted) {
				tasks = tasks.map((t) => (t.id === id ? uncompleted : t));
				return uncompleted;
			}
			throw new Error('Task not found');
		}

		// Cloud task: uncomplete via API
		try {
			const uncompletedTask = await tasksApi.uncompleteTask(id);
			tasks = tasks.map((t) => (t.id === id ? uncompletedTask : t));
			return uncompletedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to uncomplete task';
			console.error('Failed to uncomplete task:', e);
			throw e;
		}
	},

	/**
	 * Move task to a different project
	 */
	async moveTask(id: string, projectId: string | null) {
		error = null;
		try {
			const movedTask = await tasksApi.moveTask(id, projectId);
			tasks = tasks.map((t) => (t.id === id ? movedTask : t));
			return movedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to move task';
			console.error('Failed to move task:', e);
			throw e;
		}
	},

	/**
	 * Update task labels
	 */
	async updateLabels(id: string, labelIds: string[]) {
		error = null;
		try {
			const updatedTask = await tasksApi.updateTaskLabels(id, labelIds);
			tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
			return updatedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update labels';
			console.error('Failed to update labels:', e);
			throw e;
		}
	},

	/**
	 * Update subtasks
	 */
	async updateSubtasks(id: string, subtasks: Subtask[]) {
		error = null;
		try {
			const updatedTask = await tasksApi.updateSubtasks(id, subtasks);
			tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
			return updatedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update subtasks';
			console.error('Failed to update subtasks:', e);
			throw e;
		}
	},

	/**
	 * Reorder tasks
	 */
	async reorderTasks(taskIds: string[]) {
		error = null;
		try {
			await tasksApi.reorderTasks(taskIds);
			// Update local order
			tasks = tasks.map((t) => {
				const newOrder = taskIds.indexOf(t.id);
				return newOrder !== -1 ? { ...t, order: newOrder } : t;
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder tasks';
			console.error('Failed to reorder tasks:', e);
			throw e;
		}
	},

	/**
	 * Clear all state (for logout)
	 */
	clear() {
		tasks = [];
		loading = false;
		error = null;
	},

	/**
	 * Check if a task is a session task (local only)
	 */
	isSessionTask(taskId: string) {
		return sessionTasksStore.isSessionTask(taskId);
	},

	/**
	 * Migrate session tasks to cloud after login
	 * Call this after successful authentication
	 */
	async migrateSessionTasks(defaultProjectId?: string) {
		const sessionTasks = sessionTasksStore.getAllTasks();
		if (sessionTasks.length === 0) return { migrated: 0, failed: 0 };

		let migrated = 0;
		let failed = 0;

		for (const sessionTask of sessionTasks) {
			try {
				await tasksApi.createTask({
					title: sessionTask.title,
					description: sessionTask.description || undefined,
					projectId: defaultProjectId || undefined,
					dueDate: sessionTask.dueDate ? String(sessionTask.dueDate) : undefined,
					priority: sessionTask.priority,
					subtasks: sessionTask.subtasks?.map((s) => ({
						title: s.title,
						isCompleted: s.isCompleted,
						order: s.order,
					})),
				});
				migrated++;
			} catch {
				failed++;
			}
		}

		// Clear session tasks after migration
		if (migrated > 0) {
			sessionTasksStore.clear();
			console.log(`Migrated ${migrated} tasks to cloud`);
		}

		return { migrated, failed };
	},

	/**
	 * Get count of pending session tasks
	 */
	get sessionTaskCount() {
		return sessionTasksStore.count;
	},

	/**
	 * Check if there are pending session tasks to migrate
	 */
	get hasSessionTasks() {
		return sessionTasksStore.count > 0;
	},
};
