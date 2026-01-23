/**
 * Session Tasks Store - Temporary local tasks for guest users
 * Tasks are stored in sessionStorage and lost when the browser tab is closed
 */

import type { Task, TaskPriority, Subtask } from '@todo/shared';
import { browser } from '$app/environment';

const STORAGE_KEY = 'todo-session-tasks';

// Generate a unique ID for session tasks
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load tasks from sessionStorage
function loadFromStorage(): Task[] {
	if (!browser) return [];
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

// Save tasks to sessionStorage
function saveToStorage(tasks: Task[]) {
	if (!browser) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
	} catch (e) {
		console.warn('Failed to save session tasks:', e);
	}
}

// State
let tasks = $state<Task[]>(loadFromStorage());

export const sessionTasksStore = {
	get tasks() {
		return tasks;
	},

	get hasTaskks() {
		return tasks.length > 0;
	},

	/**
	 * Initialize from sessionStorage (call on mount)
	 */
	initialize() {
		tasks = loadFromStorage();
	},

	/**
	 * Create a new session task
	 */
	createTask(data: {
		title: string;
		description?: string;
		projectId?: string;
		dueDate?: string;
		priority?: TaskPriority;
		subtasks?: Subtask[];
	}): Task {
		const newTask: Task = {
			id: generateSessionId(),
			projectId: data.projectId || 'session-inbox',
			userId: 'guest',
			title: data.title,
			description: data.description || null,
			dueDate: data.dueDate || null,
			priority: data.priority || 'medium',
			status: 'pending',
			isCompleted: false,
			order: tasks.length,
			subtasks: data.subtasks || null,
			labels: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		tasks = [...tasks, newTask];
		saveToStorage(tasks);
		return newTask;
	},

	/**
	 * Update a session task
	 */
	updateTask(id: string, data: Partial<Task>): Task | null {
		const index = tasks.findIndex((t) => t.id === id);
		if (index === -1) return null;

		const updatedTask = {
			...tasks[index],
			...data,
			updatedAt: new Date().toISOString(),
		};

		tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
		saveToStorage(tasks);
		return updatedTask;
	},

	/**
	 * Complete a session task
	 */
	completeTask(id: string): Task | null {
		return this.updateTask(id, {
			isCompleted: true,
			status: 'completed',
			completedAt: new Date().toISOString(),
		});
	},

	/**
	 * Uncomplete a session task
	 */
	uncompleteTask(id: string): Task | null {
		return this.updateTask(id, {
			isCompleted: false,
			status: 'pending',
			completedAt: null,
		});
	},

	/**
	 * Delete a session task
	 */
	deleteTask(id: string): boolean {
		const hadTask = tasks.some((t) => t.id === id);
		tasks = tasks.filter((t) => t.id !== id);
		saveToStorage(tasks);
		return hadTask;
	},

	/**
	 * Get task by ID
	 */
	getById(id: string): Task | undefined {
		return tasks.find((t) => t.id === id);
	},

	/**
	 * Check if a task ID is a session task
	 */
	isSessionTask(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all tasks (for migration to cloud on login)
	 */
	getAllTasks(): Task[] {
		return [...tasks];
	},

	/**
	 * Clear all session tasks (after migration or on explicit clear)
	 */
	clear() {
		tasks = [];
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Get count of session tasks
	 */
	get count() {
		return tasks.length;
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
};
