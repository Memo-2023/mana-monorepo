/**
 * Cross-App API Client for Todo Backend
 * Allows Calendar app to fetch/manage todos from the Todo service
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createApiClient, buildQueryString, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

// Get todo API base URL from injected window variable (browser) or env (SSR)
function getTodoApiBase(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_TODO_BACKEND_URL__?: string })
			.__PUBLIC_TODO_BACKEND_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return env.PUBLIC_TODO_BACKEND_URL || 'http://localhost:3018';
}

let _todoClient: ReturnType<typeof createApiClient> | null = null;

function getTodoClient() {
	if (!_todoClient) {
		_todoClient = createApiClient({
			baseUrl: getTodoApiBase(),
			apiPrefix: '/api/v1',
			getAuthToken: () => authStore.getValidToken(),
			timeout: 30000,
			debug: import.meta.env.DEV,
			useRuntimeUrl: false,
		});
	}
	return _todoClient;
}

// For backwards compatibility
const todoClient = {
	get: <T>(endpoint: string) => getTodoClient().get<T>(endpoint),
	post: <T>(endpoint: string, body?: unknown) => getTodoClient().post<T>(endpoint, body),
	put: <T>(endpoint: string, body?: unknown) => getTodoClient().put<T>(endpoint, body),
	patch: <T>(endpoint: string, body?: unknown) => getTodoClient().patch<T>(endpoint, body),
	delete: <T>(endpoint: string) => getTodoClient().delete<T>(endpoint),
};

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
	// Time-Blocking (for calendar integration)
	scheduledDate?: string | null;
	scheduledStartTime?: string | null; // HH:mm format
	scheduledEndTime?: string | null; // HH:mm format
	estimatedDuration?: number | null; // Duration in minutes
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
	// Time-Blocking
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	scheduledEndTime?: string | null;
	estimatedDuration?: number | null;
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
	// Time-Blocking
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	scheduledEndTime?: string | null;
	estimatedDuration?: number | null;
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
// API Client (using shared base client)
// ============================================

async function fetchTodoApi<T>(
	endpoint: string,
	options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {}
): Promise<{ data: T | null; error: Error | null }> {
	const { method = 'GET', body } = options;

	let result: ApiResult<T>;
	switch (method) {
		case 'POST':
			result = await todoClient.post<T>(endpoint, body);
			break;
		case 'PUT':
			result = await todoClient.put<T>(endpoint, body);
			break;
		case 'PATCH':
			result = await todoClient.patch<T>(endpoint, body);
			break;
		case 'DELETE':
			result = await todoClient.delete<T>(endpoint);
			break;
		default:
			result = await todoClient.get<T>(endpoint);
	}

	if (result.error) {
		return { data: null, error: new Error(result.error.message) };
	}
	return { data: result.data, error: null };
}

// ============================================
// Task API Functions
// ============================================

export async function getTasks(
	query: TaskQuery = {}
): Promise<{ data: Task[] | null; error: Error | null }> {
	const queryString = buildQueryString(
		query as Record<string, string | number | boolean | undefined>
	);
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
