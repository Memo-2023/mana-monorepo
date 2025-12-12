/**
 * Todo Store for Contacts App
 * Manages tasks related to contacts from the Todo service
 */

import { browser } from '$app/environment';
import {
	getTasksByContact,
	completeTask,
	uncompleteTask,
	checkTodoServiceAvailable,
	type Task,
} from '$lib/api/todos';

// State
let tasksByContact = $state<Map<string, Task[]>>(new Map());
let loadingContacts = $state<Set<string>>(new Set());
let serviceAvailable = $state<boolean | null>(null);
let lastAvailabilityCheck = $state<number>(0);

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
// Availability check interval (30 seconds)
const AVAILABILITY_CHECK_INTERVAL = 30 * 1000;

// Cache timestamps
const cacheTimestamps = new Map<string, number>();

/**
 * Check if cached data is still valid
 */
function isCacheValid(contactId: string): boolean {
	const timestamp = cacheTimestamps.get(contactId);
	if (!timestamp) return false;
	return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Check if the Todo service is available (with caching)
 */
async function checkAvailability(): Promise<boolean> {
	if (!browser) return false;

	const now = Date.now();
	if (serviceAvailable !== null && now - lastAvailabilityCheck < AVAILABILITY_CHECK_INTERVAL) {
		return serviceAvailable;
	}

	const available = await checkTodoServiceAvailable();
	serviceAvailable = available;
	lastAvailabilityCheck = now;
	return available;
}

/**
 * Load tasks for a specific contact
 */
async function loadTasksForContact(
	contactId: string,
	includeCompleted: boolean = false,
	forceRefresh: boolean = false
): Promise<Task[]> {
	if (!browser) return [];

	// Check cache first
	if (!forceRefresh && isCacheValid(contactId)) {
		return tasksByContact.get(contactId) || [];
	}

	// Check service availability
	const available = await checkAvailability();
	if (!available) {
		return [];
	}

	// Mark as loading
	loadingContacts = new Set([...loadingContacts, contactId]);

	try {
		const { data, error } = await getTasksByContact(contactId, includeCompleted);

		if (error) {
			console.error(`Failed to load tasks for contact ${contactId}:`, error);
			return [];
		}

		const tasks = data || [];

		// Update cache
		tasksByContact = new Map(tasksByContact).set(contactId, tasks);
		cacheTimestamps.set(contactId, Date.now());

		return tasks;
	} finally {
		// Remove from loading set
		const newLoading = new Set(loadingContacts);
		newLoading.delete(contactId);
		loadingContacts = newLoading;
	}
}

/**
 * Get cached tasks for a contact (does not fetch)
 */
function getTasksForContact(contactId: string): Task[] {
	return tasksByContact.get(contactId) || [];
}

/**
 * Check if tasks are currently loading for a contact
 */
function isLoading(contactId: string): boolean {
	return loadingContacts.has(contactId);
}

/**
 * Toggle task completion
 */
async function toggleTaskCompletion(taskId: string, contactId: string): Promise<boolean> {
	const tasks = tasksByContact.get(contactId) || [];
	const task = tasks.find((t) => t.id === taskId);

	if (!task) return false;

	const { data, error } = task.isCompleted
		? await uncompleteTask(taskId)
		: await completeTask(taskId);

	if (error || !data) {
		console.error('Failed to toggle task completion:', error);
		return false;
	}

	// Update local state
	const updatedTasks = tasks.map((t) => (t.id === taskId ? data : t));
	tasksByContact = new Map(tasksByContact).set(contactId, updatedTasks);

	return true;
}

/**
 * Clear cache for a specific contact
 */
function clearCacheForContact(contactId: string): void {
	const newMap = new Map(tasksByContact);
	newMap.delete(contactId);
	tasksByContact = newMap;
	cacheTimestamps.delete(contactId);
}

/**
 * Clear all cached data
 */
function clearCache(): void {
	tasksByContact = new Map();
	cacheTimestamps.clear();
}

/**
 * Categorize tasks by their relation to the contact
 */
function categorizeTasksForContact(contactId: string): { assigned: Task[]; involved: Task[] } {
	const tasks = tasksByContact.get(contactId) || [];

	const assigned: Task[] = [];
	const involved: Task[] = [];

	for (const task of tasks) {
		const isAssignee = task.metadata?.assignee?.contactId === contactId;
		const isInvolved = task.metadata?.involvedContacts?.some((c) => c.contactId === contactId);

		if (isAssignee) {
			assigned.push(task);
		} else if (isInvolved) {
			involved.push(task);
		}
	}

	// Sort by due date (overdue first, then by date)
	const sortByDueDate = (a: Task, b: Task): number => {
		if (!a.dueDate && !b.dueDate) return 0;
		if (!a.dueDate) return 1;
		if (!b.dueDate) return -1;
		return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
	};

	assigned.sort(sortByDueDate);
	involved.sort(sortByDueDate);

	return { assigned, involved };
}

// Export store
export const todosStore = {
	// Getters (reactive)
	get serviceAvailable() {
		return serviceAvailable;
	},

	// Methods
	checkAvailability,
	loadTasksForContact,
	getTasksForContact,
	isLoading,
	toggleTaskCompletion,
	clearCacheForContact,
	clearCache,
	categorizeTasksForContact,
};
