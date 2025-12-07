import { apiClient } from './client';
import type { KanbanColumn, Task } from '@todo/shared';

interface ColumnsResponse {
	columns: KanbanColumn[];
}

interface ColumnResponse {
	column: KanbanColumn;
}

interface KanbanTasksResponse {
	columns: KanbanColumn[];
	tasksByColumn: Record<string, Task[]>;
}

interface TaskResponse {
	task: Task;
}

interface TasksResponse {
	tasks: Task[];
}

interface CreateColumnDto {
	name: string;
	color?: string;
	projectId?: string;
	isDefault?: boolean;
	defaultStatus?: string;
	autoComplete?: boolean;
}

interface UpdateColumnDto {
	name?: string;
	color?: string;
	defaultStatus?: string;
	autoComplete?: boolean;
}

// Column operations

export async function getColumns(projectId?: string): Promise<KanbanColumn[]> {
	const query = projectId ? `?projectId=${projectId}` : '';
	const response = await apiClient.get<ColumnsResponse>(`/api/v1/kanban/columns${query}`);
	return response.columns;
}

export async function createColumn(data: CreateColumnDto): Promise<KanbanColumn> {
	const response = await apiClient.post<ColumnResponse>('/api/v1/kanban/columns', data);
	return response.column;
}

export async function updateColumn(id: string, data: UpdateColumnDto): Promise<KanbanColumn> {
	const response = await apiClient.put<ColumnResponse>(`/api/v1/kanban/columns/${id}`, data);
	return response.column;
}

export async function deleteColumn(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/kanban/columns/${id}`);
}

export async function reorderColumns(columnIds: string[]): Promise<KanbanColumn[]> {
	const response = await apiClient.put<ColumnsResponse>('/api/v1/kanban/columns/reorder', {
		columnIds,
	});
	return response.columns;
}

export async function initializeColumns(projectId?: string): Promise<KanbanColumn[]> {
	const query = projectId ? `?projectId=${projectId}` : '';
	const response = await apiClient.post<ColumnsResponse>(`/api/v1/kanban/columns/init${query}`);
	return response.columns;
}

// Task operations

export async function getKanbanTasks(
	projectId?: string
): Promise<{ columns: KanbanColumn[]; tasksByColumn: Record<string, Task[]> }> {
	const query = projectId ? `?projectId=${projectId}` : '';
	const response = await apiClient.get<KanbanTasksResponse>(`/api/v1/kanban/tasks${query}`);
	return response;
}

export async function moveTaskToColumn(
	taskId: string,
	columnId: string,
	order?: number
): Promise<Task> {
	const response = await apiClient.post<TaskResponse>(`/api/v1/kanban/tasks/${taskId}/move`, {
		columnId,
		order,
	});
	return response.task;
}

export async function reorderTasksInColumn(columnId: string, taskIds: string[]): Promise<Task[]> {
	const response = await apiClient.put<TasksResponse>('/api/v1/kanban/tasks/reorder', {
		columnId,
		taskIds,
	});
	return response.tasks;
}
