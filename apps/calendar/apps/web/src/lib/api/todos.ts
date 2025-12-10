/**
 * Cross-App API Client for Todo Backend
 * Allows Calendar app to fetch/manage todos from the Todo service
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const TODO_API_BASE = env.PUBLIC_TODO_BACKEND_URL || 'http://localhost:3018';

// ============================================
// Types (mirrored from @todo/shared for cross-app use)
// ============================================

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

export interface CreateTaskInput {
	title: string;
	description?: string;
	projectId?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	priority?: TaskPriority;
	labelIds?: string[];
	subtasks?: Omit<Subtask, 'id'>[];
	recurrenceRule?: string | null;
	metadata?: TaskMetadata;
}

export interface UpdateTaskInput {
	title?: string;
	description?: string | null;
	projectId?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	priority?: TaskPriority;
	status?: TaskStatus;
	isCompleted?: boolean;
	subtasks?: Subtask[] | null;
	recurrenceRule?: string | null;
	metadata?: TaskMetadata | null;
	labelIds?: string[];
}

export interface TaskQuery {
	projectId?: string;
	labelId?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
	isCompleted?: boolean;
	dueDateFrom?: string;
	dueDateTo?: string;
	search?: string;
	sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'order';
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

// ============================================
// API Response Types
// ============================================

interface TasksResponse {
	tasks: Task[];
}

interface TaskResponse {
	task: Task;
}

interface ProjectsResponse {
	projects: Project[];
}

interface LabelsResponse {
	labels: Label[];
}

// ============================================
// API Client
// ============================================

type FetchOptions = {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
	token?: string;
};

async function fetchTodoApi<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body, token } = options;

	let authToken = token;
	if (!authToken && browser) {
		authToken = localStorage.getItem('@auth/appToken') || undefined;
	}

	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}

		const response = await fetch(`${TODO_API_BASE}/api/v1${endpoint}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				data: null,
				error: new Error(errorData.message || `Todo API error: ${response.status}`),
			};
		}

		// Handle empty responses (204 No Content)
		if (response.status === 204) {
			return { data: null, error: null };
		}

		const data = await response.json();
		return { data, error: null };
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error('Failed to connect to Todo service'),
		};
	}
}

// ============================================
// Helper Functions
// ============================================

function buildQueryString(query: TaskQuery): string {
	const params = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			params.append(key, String(value));
		}
	});
	const queryString = params.toString();
	return queryString ? `?${queryString}` : '';
}

// ============================================
// Task API Functions
// ============================================

export async function getTasks(
	query: TaskQuery = {}
): Promise<{ data: Task[] | null; error: Error | null }> {
	const queryString = buildQueryString(query);
	const result = await fetchTodoApi<TasksResponse>(`/tasks${queryString}`);
	return {
		data: result.data?.tasks || null,
		error: result.error,
	};
}

export async function getTask(id: string): Promise<{ data: Task | null; error: Error | null }> {
	const result = await fetchTodoApi<TaskResponse>(`/tasks/${id}`);
	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

export async function createTask(
	data: CreateTaskInput
): Promise<{ data: Task | null; error: Error | null }> {
	const result = await fetchTodoApi<TaskResponse>('/tasks', {
		method: 'POST',
		body: data,
	});
	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

export async function updateTask(
	id: string,
	data: UpdateTaskInput
): Promise<{ data: Task | null; error: Error | null }> {
	const result = await fetchTodoApi<TaskResponse>(`/tasks/${id}`, {
		method: 'PUT',
		body: data,
	});
	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

export async function deleteTask(id: string): Promise<{ error: Error | null }> {
	const result = await fetchTodoApi(`/tasks/${id}`, {
		method: 'DELETE',
	});
	return { error: result.error };
}

export async function completeTask(
	id: string
): Promise<{ data: Task | null; error: Error | null }> {
	const result = await fetchTodoApi<TaskResponse>(`/tasks/${id}/complete`, {
		method: 'POST',
	});
	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

export async function uncompleteTask(
	id: string
): Promise<{ data: Task | null; error: Error | null }> {
	const result = await fetchTodoApi<TaskResponse>(`/tasks/${id}/uncomplete`, {
		method: 'POST',
	});
	return {
		data: result.data?.task || null,
		error: result.error,
	};
}

export async function getTodayTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
	const result = await fetchTodoApi<TasksResponse>('/tasks/today');
	return {
		data: result.data?.tasks || null,
		error: result.error,
	};
}

export async function getUpcomingTasks(): Promise<{ data: Task[] | null; error: Error | null }> {
	const result = await fetchTodoApi<TasksResponse>('/tasks/upcoming');
	return {
		data: result.data?.tasks || null,
		error: result.error,
	};
}

// ============================================
// Project API Functions
// ============================================

export async function getProjects(): Promise<{ data: Project[] | null; error: Error | null }> {
	const result = await fetchTodoApi<ProjectsResponse>('/projects');
	return {
		data: result.data?.projects || null,
		error: result.error,
	};
}

// ============================================
// Label API Functions
// ============================================

export async function getLabels(): Promise<{ data: Label[] | null; error: Error | null }> {
	const result = await fetchTodoApi<LabelsResponse>('/labels');
	return {
		data: result.data?.labels || null,
		error: result.error,
	};
}

// ============================================
// Priority Colors Helper
// ============================================

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
	urgent: 'hsl(var(--color-danger))',
	high: 'hsl(var(--color-warning))',
	medium: 'hsl(var(--color-accent))',
	low: 'hsl(var(--color-success))',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
	urgent: 'Dringend',
	high: 'Wichtig',
	medium: 'Normal',
	low: 'Später',
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
	urgent: 0,
	high: 1,
	medium: 2,
	low: 3,
};
