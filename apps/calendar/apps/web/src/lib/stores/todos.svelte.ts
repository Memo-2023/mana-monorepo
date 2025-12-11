/**
 * Todos Store - Manages todos from Todo-App using Svelte 5 runes
 * Cross-app integration with Todo Backend
 */

import * as api from '$lib/api/todos';
import type {
	Task,
	TaskPriority,
	CreateTaskInput,
	UpdateTaskInput,
	TaskQuery,
	Project,
	Label,
} from '$lib/api/todos';
import { PRIORITY_ORDER } from '$lib/api/todos';
import {
	format,
	parseISO,
	isSameDay,
	isToday,
	isBefore,
	startOfDay,
	addDays,
	isWithinInterval,
} from 'date-fns';

// Re-export types for convenience
export type { Task, TaskPriority, CreateTaskInput, UpdateTaskInput, Project, Label };

// State
let todos = $state<Task[]>([]);
let projects = $state<Project[]>([]);
let labels = $state<Label[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let loadedRange = $state<{ start: Date; end: Date } | null>(null);
let serviceAvailable = $state(true);

export const todosStore = {
	// ========== Getters ==========
	get todos() {
		return todos ?? [];
	},
	get projects() {
		return projects ?? [];
	},
	get labels() {
		return labels ?? [];
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get serviceAvailable() {
		return serviceAvailable;
	},

	// ========== Derived Getters ==========

	/**
	 * Get todos for a specific day
	 */
	getTodosForDay(date: Date): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos.filter((task) => {
			if (!task.dueDate || task.isCompleted) return false;
			const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
			return isSameDay(dueDate, date);
		});
	},

	/**
	 * Get scheduled tasks for a specific day (by scheduledDate - for time-blocking)
	 * Note: Includes completed tasks so they remain visible in the calendar
	 */
	getScheduledTasksForDay(date: Date): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos.filter((task) => {
			if (!task.scheduledDate) return false;
			const scheduledDate =
				typeof task.scheduledDate === 'string' ? parseISO(task.scheduledDate) : task.scheduledDate;
			return isSameDay(scheduledDate, date);
		});
	},

	/**
	 * Get scheduled tasks within a date range (for time-blocking)
	 * Note: Includes completed tasks so they remain visible in the calendar
	 */
	getScheduledTasksInRange(start: Date, end: Date): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos.filter((task) => {
			if (!task.scheduledDate) return false;
			const scheduledDate =
				typeof task.scheduledDate === 'string' ? parseISO(task.scheduledDate) : task.scheduledDate;
			return isWithinInterval(scheduledDate, { start, end });
		});
	},

	/**
	 * Get unscheduled tasks (no scheduledDate - for sidebar drag source)
	 */
	get unscheduledForTimeBlocking(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos
			.filter((task) => !task.isCompleted && !task.scheduledDate)
			.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
	},

	/**
	 * Get todos within a date range
	 */
	getTodosInRange(start: Date, end: Date): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos.filter((task) => {
			if (!task.dueDate) return false;
			const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
			return isWithinInterval(dueDate, { start, end });
		});
	},

	/**
	 * Get today's uncompleted todos
	 */
	get todaysTodos(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos
			.filter((task) => {
				if (task.isCompleted) return false;
				if (!task.dueDate) return false;
				const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
				return isToday(dueDate);
			})
			.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
	},

	/**
	 * Get overdue todos (due before today, not completed)
	 */
	get overdueTodos(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		const today = startOfDay(new Date());

		return currentTodos
			.filter((task) => {
				if (task.isCompleted) return false;
				if (!task.dueDate) return false;
				const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
				return isBefore(startOfDay(dueDate), today);
			})
			.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
	},

	/**
	 * Get upcoming todos (next 7 days, not including today)
	 */
	get upcomingTodos(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		const tomorrow = startOfDay(addDays(new Date(), 1));
		const weekFromNow = startOfDay(addDays(new Date(), 7));

		return currentTodos
			.filter((task) => {
				if (task.isCompleted) return false;
				if (!task.dueDate) return false;
				const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
				return isWithinInterval(startOfDay(dueDate), { start: tomorrow, end: weekFromNow });
			})
			.sort((a, b) => {
				// First sort by date
				const dateA = a.dueDate ? parseISO(a.dueDate as string) : new Date();
				const dateB = b.dueDate ? parseISO(b.dueDate as string) : new Date();
				const dateDiff = dateA.getTime() - dateB.getTime();
				if (dateDiff !== 0) return dateDiff;
				// Then by priority
				return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
			});
	},

	/**
	 * Get todos without due date
	 */
	get unscheduledTodos(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos
			.filter((task) => !task.isCompleted && !task.dueDate)
			.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
	},

	/**
	 * Get completed todos
	 */
	get completedTodos(): Task[] {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return [];

		return currentTodos.filter((task) => task.isCompleted);
	},

	/**
	 * Get combined sidebar todos (overdue + today, sorted by priority)
	 * Limited to show in sidebar
	 */
	getSidebarTodos(limit = 5): Task[] {
		const overdue = this.overdueTodos;
		const today = this.todaysTodos;

		// Combine and sort: overdue first, then today, both by priority
		const combined = [...overdue, ...today];

		return combined.slice(0, limit);
	},

	/**
	 * Get total count of active todos (not completed)
	 */
	get activeTodosCount(): number {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return 0;

		return currentTodos.filter((task) => !task.isCompleted).length;
	},

	// ========== API Methods ==========

	/**
	 * Fetch todos for a date range
	 * Note: Fetches both completed and uncompleted tasks so scheduled tasks remain visible
	 */
	async fetchTodos(startDate?: Date, endDate?: Date) {
		loading = true;
		error = null;

		const query: TaskQuery = {};

		if (startDate) {
			query.dueDateFrom = format(startDate, 'yyyy-MM-dd');
		}
		if (endDate) {
			query.dueDateTo = format(endDate, 'yyyy-MM-dd');
		}

		const result = await api.getTasks(query);

		if (result.error) {
			error = result.error.message;
			serviceAvailable = false;
		} else {
			todos = result.data || [];
			serviceAvailable = true;
			if (startDate && endDate) {
				loadedRange = { start: startDate, end: endDate };
			}
		}

		loading = false;
		return result;
	},

	/**
	 * Fetch today's todos (shortcut) - only uncompleted tasks
	 */
	async fetchTodayTodos() {
		loading = true;
		error = null;

		const result = await api.getTodayTasks();

		if (result.error) {
			error = result.error.message;
			serviceAvailable = false;
		} else {
			// Merge with existing todos (avoid duplicates)
			const newTodos = result.data || [];
			const existingIds = new Set(todos.map((t) => t.id));
			const uniqueNew = newTodos.filter((t) => !existingIds.has(t.id));
			todos = [...todos, ...uniqueNew];
			serviceAvailable = true;
		}

		loading = false;
		return result;
	},

	/**
	 * Fetch all scheduled todos (including completed ones)
	 * Used for calendar time-blocking to keep completed tasks visible
	 */
	async fetchScheduledTodos() {
		loading = true;
		error = null;

		// Fetch all tasks without isCompleted filter - API will return all
		const result = await api.getTasks({});

		if (result.error) {
			error = result.error.message;
			serviceAvailable = false;
		} else {
			// Only keep tasks that have a scheduledDate (for time-blocking)
			// Merge with existing todos (avoid duplicates)
			const allTasks = result.data || [];
			const scheduledTasks = allTasks.filter((t) => t.scheduledDate);
			const existingIds = new Set(todos.map((t) => t.id));
			const uniqueNew = scheduledTasks.filter((t) => !existingIds.has(t.id));
			// Also update existing scheduled tasks (in case isCompleted changed)
			todos = todos.map((existing) => {
				const updated = scheduledTasks.find((t) => t.id === existing.id);
				return updated || existing;
			});
			todos = [...todos, ...uniqueNew];
			serviceAvailable = true;
		}

		loading = false;
		return result;
	},

	/**
	 * Fetch upcoming todos (shortcut)
	 */
	async fetchUpcomingTodos() {
		loading = true;
		error = null;

		const result = await api.getUpcomingTasks();

		if (result.error) {
			error = result.error.message;
			serviceAvailable = false;
		} else {
			// Merge with existing todos (avoid duplicates)
			const newTodos = result.data || [];
			const existingIds = new Set(todos.map((t) => t.id));
			const uniqueNew = newTodos.filter((t) => !existingIds.has(t.id));
			todos = [...todos, ...uniqueNew];
			serviceAvailable = true;
		}

		loading = false;
		return result;
	},

	/**
	 * Fetch projects
	 */
	async fetchProjects() {
		const result = await api.getProjects();

		if (!result.error && result.data) {
			projects = result.data;
		}

		return result;
	},

	/**
	 * Fetch labels
	 */
	async fetchLabels() {
		const result = await api.getLabels();

		if (!result.error && result.data) {
			labels = result.data;
		}

		return result;
	},

	/**
	 * Create a new todo
	 */
	async createTodo(data: CreateTaskInput) {
		const result = await api.createTask(data);

		if (result.data) {
			todos = [...todos, result.data];
		}

		return result;
	},

	/**
	 * Update a todo
	 */
	async updateTodo(id: string, data: UpdateTaskInput) {
		const result = await api.updateTask(id, data);

		if (result.data) {
			todos = todos.map((t) => (t.id === id ? result.data! : t));
		}

		return result;
	},

	/**
	 * Delete a todo
	 */
	async deleteTodo(id: string) {
		const result = await api.deleteTask(id);

		if (!result.error) {
			todos = todos.filter((t) => t.id !== id);
		}

		return result;
	},

	/**
	 * Toggle todo completion
	 */
	async toggleComplete(id: string) {
		const todo = todos.find((t) => t.id === id);
		if (!todo) return { data: null, error: new Error('Todo not found') };

		const result = todo.isCompleted ? await api.uncompleteTask(id) : await api.completeTask(id);

		if (result.data) {
			todos = todos.map((t) => (t.id === id ? result.data! : t));
		}

		return result;
	},

	/**
	 * Get todo by ID
	 */
	getById(id: string): Task | undefined {
		const currentTodos = todos ?? [];
		if (!Array.isArray(currentTodos)) return undefined;

		return currentTodos.find((t) => t.id === id);
	},

	/**
	 * Get project by ID
	 */
	getProjectById(id: string): Project | undefined {
		const currentProjects = projects ?? [];
		if (!Array.isArray(currentProjects)) return undefined;

		return currentProjects.find((p) => p.id === id);
	},

	/**
	 * Clear todos cache
	 */
	clear() {
		todos = [];
		loadedRange = null;
	},

	/**
	 * Check if Todo service is available
	 */
	async checkServiceHealth(): Promise<boolean> {
		const result = await api.getTasks({ limit: 1 });
		serviceAvailable = !result.error;
		return serviceAvailable;
	},
};
