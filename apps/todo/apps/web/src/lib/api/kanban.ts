import { apiClient } from './client';
import type { KanbanBoard, KanbanColumn, Task } from '@todo/shared';

// Response types

interface BoardsResponse {
	boards: KanbanBoard[];
}

interface BoardResponse {
	board: KanbanBoard;
}

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

// DTO types

interface CreateBoardDto {
	name: string;
	projectId?: string;
	color?: string;
	icon?: string;
}

interface UpdateBoardDto {
	name?: string;
	color?: string;
	icon?: string;
}

interface CreateColumnDto {
	name: string;
	boardId: string;
	color?: string;
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

// =====================
// Board operations
// =====================

export async function getBoards(): Promise<KanbanBoard[]> {
	const response = await apiClient.get<BoardsResponse>('/api/v1/kanban/boards');
	return response.boards;
}

export async function getGlobalBoard(): Promise<KanbanBoard> {
	const response = await apiClient.get<BoardResponse>('/api/v1/kanban/boards/global');
	return response.board;
}

export async function getBoard(id: string): Promise<KanbanBoard> {
	const response = await apiClient.get<BoardResponse>(`/api/v1/kanban/boards/${id}`);
	return response.board;
}

export async function createBoard(data: CreateBoardDto): Promise<KanbanBoard> {
	const response = await apiClient.post<BoardResponse>('/api/v1/kanban/boards', data);
	return response.board;
}

export async function updateBoard(id: string, data: UpdateBoardDto): Promise<KanbanBoard> {
	const response = await apiClient.put<BoardResponse>(`/api/v1/kanban/boards/${id}`, data);
	return response.board;
}

export async function deleteBoard(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/kanban/boards/${id}`);
}

export async function reorderBoards(boardIds: string[]): Promise<KanbanBoard[]> {
	const response = await apiClient.put<BoardsResponse>('/api/v1/kanban/boards/reorder', {
		boardIds,
	});
	return response.boards;
}

// =====================
// Column operations
// =====================

export async function getColumns(boardId: string): Promise<KanbanColumn[]> {
	const response = await apiClient.get<ColumnsResponse>(
		`/api/v1/kanban/columns?boardId=${boardId}`
	);
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

export async function initializeColumns(boardId: string): Promise<KanbanColumn[]> {
	const response = await apiClient.post<ColumnsResponse>(
		`/api/v1/kanban/columns/init?boardId=${boardId}`
	);
	return response.columns;
}

// =====================
// Task operations
// =====================

export async function getKanbanTasks(
	boardId: string
): Promise<{ columns: KanbanColumn[]; tasksByColumn: Record<string, Task[]> }> {
	const response = await apiClient.get<KanbanTasksResponse>(
		`/api/v1/kanban/tasks?boardId=${boardId}`
	);
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
