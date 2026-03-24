/**
 * Tasks Store - Manages task state using Svelte 5 runes
 * Authenticated users: tasks from API
 * Demo mode: static sample tasks to showcase the app
 */

import type { Task, TaskPriority, TaskStatus, Subtask } from '@todo/shared';
import * as tasksApi from '$lib/api/tasks';
import { isToday, isPast, isFuture, startOfDay, addDays } from 'date-fns';
import { authStore } from './auth.svelte';
import { generateDemoTasks, isDemoTask } from '$lib/data/demo-tasks';
import { TodoEvents } from '@manacore/shared-utils/analytics';

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
	 * In demo mode, shows static sample tasks
	 */
	async fetchAllTasks() {
		loading = true;
		error = null;

		// Demo mode: load static demo tasks
		if (!authStore.isAuthenticated) {
			tasks = generateDemoTasks();
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
	 * Requires authentication - demo mode shows auth gate
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

		// Demo mode: require authentication
		if (!authStore.isAuthenticated) {
			return { error: 'auth_required' as const };
		}

		// Authenticated: create via API
		try {
			const newTask = await tasksApi.createTask(data);
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
	 * Update an existing task
	 * Demo tasks require authentication
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

		// Demo task: require authentication
		if (isDemoTask(id)) {
			return { error: 'auth_required' as const };
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
	 * Demo tasks require authentication
	 */
	async updateTaskOptimistic(
		id: string,
		data: {
			dueDate?: string | null;
			isCompleted?: boolean;
		}
	) {
		// Demo task: require authentication
		if (isDemoTask(id)) {
			return { error: 'auth_required' as const };
		}

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
	 * Demo tasks require authentication
	 */
	async deleteTask(id: string) {
		error = null;

		// Demo task: require authentication
		if (isDemoTask(id)) {
			return { error: 'auth_required' as const };
		}

		// Cloud task: delete via API
		try {
			await tasksApi.deleteTask(id);
			tasks = tasks.filter((t) => t.id !== id);
			TodoEvents.taskDeleted();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete task';
			console.error('Failed to delete task:', e);
			throw e;
		}
	},

	/**
	 * Mark task as complete
	 * Demo tasks require authentication
	 */
	async completeTask(id: string) {
		error = null;

		// Demo task: require authentication
		if (isDemoTask(id)) {
			return { error: 'auth_required' as const };
		}

		// Cloud task: complete via API
		try {
			const completedTask = await tasksApi.completeTask(id);
			tasks = tasks.map((t) => (t.id === id ? completedTask : t));
			TodoEvents.taskCompleted();
			return completedTask;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to complete task';
			console.error('Failed to complete task:', e);
			throw e;
		}
	},

	/**
	 * Mark task as incomplete
	 * Demo tasks require authentication
	 */
	async uncompleteTask(id: string) {
		error = null;

		// Demo task: require authentication
		if (isDemoTask(id)) {
			return { error: 'auth_required' as const };
		}

		// Cloud task: uncomplete via API
		try {
			const uncompletedTask = await tasksApi.uncompleteTask(id);
			tasks = tasks.map((t) => (t.id === id ? uncompletedTask : t));
			TodoEvents.taskUncompleted();
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
		const previousTasks = [...tasks];
		try {
			// Optimistic update - set new order values
			tasks = tasks.map((t) => {
				const newOrder = taskIds.indexOf(t.id);
				return newOrder !== -1 ? { ...t, order: newOrder } : t;
			});
			await tasksApi.reorderTasks(taskIds);
		} catch (e) {
			// Rollback on error
			tasks = previousTasks;
			error = e instanceof Error ? e.message : 'Failed to reorder tasks';
			console.error('Failed to reorder tasks:', e);
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
	 * Check if a task is a demo task (static sample data)
	 */
	isDemoTask(taskId: string) {
		return isDemoTask(taskId);
	},
};
