import { apiClient } from './client';
import type { Task, TaskPriority, TaskStatus, Subtask, Label } from '@todo/shared';

interface CreateTaskDto {
	title: string;
	description?: string;
	projectId?: string;
	dueDate?: string;
	priority?: TaskPriority;
	labelIds?: string[];
	subtasks?: Subtask[];
	recurrenceRule?: string;
}

interface UpdateTaskDto {
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
	metadata?: Record<string, unknown> | null;
	labelIds?: string[];
}

interface TaskQuery {
	projectId?: string;
	labelId?: string;
	priority?: TaskPriority;
	status?: TaskStatus;
	dueBefore?: string;
	dueAfter?: string;
	isCompleted?: boolean;
	search?: string;
}

interface TasksResponse {
	tasks: Task[];
}

interface TaskResponse {
	task: Task;
}

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

export async function getTasks(query: TaskQuery = {}): Promise<Task[]> {
	const queryString = buildQueryString(query);
	const response = await apiClient.get<TasksResponse>(`/api/v1/tasks${queryString}`);
	return response.tasks;
}

export async function getTask(id: string): Promise<Task> {
	const response = await apiClient.get<TaskResponse>(`/api/v1/tasks/${id}`);
	return response.task;
}

export async function createTask(data: CreateTaskDto): Promise<Task> {
	const response = await apiClient.post<TaskResponse>('/api/v1/tasks', data);
	return response.task;
}

export async function updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
	const response = await apiClient.put<TaskResponse>(`/api/v1/tasks/${id}`, data);
	return response.task;
}

export async function deleteTask(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/tasks/${id}`);
}

export async function completeTask(id: string): Promise<Task> {
	const response = await apiClient.post<TaskResponse>(`/api/v1/tasks/${id}/complete`);
	return response.task;
}

export async function uncompleteTask(id: string): Promise<Task> {
	const response = await apiClient.post<TaskResponse>(`/api/v1/tasks/${id}/uncomplete`);
	return response.task;
}

export async function moveTask(id: string, projectId: string | null): Promise<Task> {
	const response = await apiClient.post<TaskResponse>(`/api/v1/tasks/${id}/move`, { projectId });
	return response.task;
}

export async function updateTaskLabels(id: string, labelIds: string[]): Promise<Task> {
	const response = await apiClient.put<TaskResponse>(`/api/v1/tasks/${id}/labels`, { labelIds });
	return response.task;
}

export async function updateSubtasks(id: string, subtasks: Subtask[]): Promise<Task> {
	const response = await apiClient.put<TaskResponse>(`/api/v1/tasks/${id}/subtasks`, { subtasks });
	return response.task;
}

export async function getInboxTasks(): Promise<Task[]> {
	const response = await apiClient.get<TasksResponse>('/api/v1/tasks/inbox');
	return response.tasks;
}

export async function getTodayTasks(): Promise<Task[]> {
	const response = await apiClient.get<TasksResponse>('/api/v1/tasks/today');
	return response.tasks;
}

export async function getUpcomingTasks(): Promise<Task[]> {
	const response = await apiClient.get<TasksResponse>('/api/v1/tasks/upcoming');
	return response.tasks;
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
	await apiClient.put('/api/v1/tasks/reorder', { taskIds });
}
