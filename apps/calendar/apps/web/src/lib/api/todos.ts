/**
 * Cross-App API Client for Todo Backend
 * Allows Calendar app to fetch/manage todos from the Todo service
 */

import { env } from '$env/dynamic/public';
import { createApiClient, buildQueryString } from './base-client';

const TODO_API_BASE = env.PUBLIC_TODO_BACKEND_URL || 'http://localhost:3018';

const todoClient = createApiClient({
	baseUrl: TODO_API_BASE,
	apiPrefix: '/api/v1',
});

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
// API Client (using shared base client)
// ============================================

const fetchTodoApi = todoClient.fetchApi;

// ============================================
// Task API Functions
// ============================================

export async function getTasks(
	query: TaskQuery = {}
): Promise<{ data: Task[] | null; error: Error | null }> {
	const queryString = buildQueryString(query as Record<string, unknown>);
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
	console.log('[TodoAPI] Fetching /tasks/today from:', TODO_API_BASE);
	const result = await fetchTodoApi<TasksResponse>('/tasks/today');
	console.log('[TodoAPI] Response:', result);
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
