/**
 * Cross-App API Client for Todo Backend
 * Allows Contacts app to fetch tasks related to a contact
 */

import { browser } from '$app/environment';
import { authStore } from '$lib/stores/auth.svelte';

// Types mirrored from @todo/shared
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
}

export interface Label {
	id: string;
	userId: string;
	name: string;
	color: string;
	createdAt: string;
	updatedAt: string;
}

export interface Project {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	color: string;
	icon?: string | null;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ContactReference {
	contactId: string;
	displayName: string;
	email?: string;
	photoUrl?: string;
	company?: string;
	fetchedAt: string;
}

export interface TaskMetadata {
	notes?: string;
	attachments?: string[];
	linkedCalendarEventId?: string | null;
	storyPoints?: number | null;
	effectiveDuration?: {
		value: number;
		unit: 'minutes' | 'hours' | 'days';
	} | null;
	funRating?: number | null;
	assignee?: ContactReference | null;
	involvedContacts?: ContactReference[];
}

export interface Task {
	id: string;
	projectId?: string | null;
	userId: string;
	parentTaskId?: string | null;
	title: string;
	description?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	startDate?: string | null;
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	scheduledEndTime?: string | null;
	estimatedDuration?: number | null;
	priority: TaskPriority;
	status: TaskStatus;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
	columnId?: string | null;
	columnOrder?: number;
	recurrenceRule?: string | null;
	recurrenceEndDate?: string | null;
	lastOccurrence?: string | null;
	subtasks?: Subtask[] | null;
	metadata?: TaskMetadata | null;
	labels?: Label[];
	project?: Project | null;
	createdAt: string;
	updatedAt: string;
}

// API Configuration
function getTodoApiBase(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_TODO_BACKEND_URL__?: string })
			.__PUBLIC_TODO_BACKEND_URL__;
		return injectedUrl || 'http://localhost:3018';
	}
	return 'http://localhost:3018';
}

interface ApiResult<T> {
	data: T | null;
	error: Error | null;
}

async function fetchTodoApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
	const token = await authStore.getAccessToken();
	const baseUrl = getTodoApiBase();

	try {
		const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(options.headers || {}),
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: new Error(errorData.message || `API error: ${response.status}`),
			};
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Unknown error'),
		};
	}
}

// API Functions

/**
 * Get tasks related to a specific contact (assigned or involved)
 */
export async function getTasksByContact(
	contactId: string,
	includeCompleted: boolean = false
): Promise<ApiResult<Task[]>> {
	const params = new URLSearchParams();
	if (includeCompleted) {
		params.set('includeCompleted', 'true');
	}
	const query = params.toString();

	const result = await fetchTodoApi<{ tasks: Task[] }>(
		`/tasks/by-contact/${contactId}${query ? `?${query}` : ''}`
	);

	return {
		data: result.data?.tasks || null,
		error: result.error,
	};
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<ApiResult<Task>> {
	const result = await fetchTodoApi<{ task: Task }>(`/tasks/${taskId}/complete`, {
		method: 'POST',
	});

	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

/**
 * Uncomplete a task
 */
export async function uncompleteTask(taskId: string): Promise<ApiResult<Task>> {
	const result = await fetchTodoApi<{ task: Task }>(`/tasks/${taskId}/uncomplete`, {
		method: 'POST',
	});

	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

/**
 * Check if the Todo service is available
 */
export async function checkTodoServiceAvailable(): Promise<boolean> {
	try {
		const baseUrl = getTodoApiBase();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(`${baseUrl}/api/v1/health`, {
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		return response.ok;
	} catch {
		return false;
	}
}

// Priority styling helpers
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
	urgent: 'var(--color-danger, #ef4444)',
	high: 'var(--color-warning, #f59e0b)',
	medium: 'var(--color-accent, #3b82f6)',
	low: 'var(--color-success, #22c55e)',
};

export const PRIORITY_LABELS: Record<TaskPriority, { de: string; en: string }> = {
	urgent: { de: 'Dringend', en: 'Urgent' },
	high: { de: 'Wichtig', en: 'High' },
	medium: { de: 'Normal', en: 'Medium' },
	low: { de: 'Niedrig', en: 'Low' },
};
