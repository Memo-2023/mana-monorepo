import type { TaskStatus } from './task';

// Kanban Board
export interface KanbanBoard {
	id: string;
	userId: string;
	projectId?: string | null;
	name: string;
	color: string;
	icon?: string | null;
	order: number;
	isGlobal: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateBoardInput {
	name: string;
	projectId?: string;
	color?: string;
	icon?: string;
}

export interface UpdateBoardInput {
	name?: string;
	color?: string;
	icon?: string;
}

export interface ReorderBoardsInput {
	boardIds: string[];
}

// Kanban Column
export interface KanbanColumn {
	id: string;
	userId: string;
	boardId: string;
	name: string;
	color: string;
	order: number;
	isDefault: boolean;
	defaultStatus?: TaskStatus | null;
	autoComplete: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateColumnInput {
	name: string;
	boardId: string;
	color?: string;
	isDefault?: boolean;
	defaultStatus?: TaskStatus;
	autoComplete?: boolean;
}

export interface UpdateColumnInput {
	name?: string;
	color?: string;
	defaultStatus?: TaskStatus;
	autoComplete?: boolean;
}

export interface ReorderColumnsInput {
	columnIds: string[];
}

export interface MoveTaskToColumnInput {
	columnId: string;
	order?: number;
}

export interface ReorderTasksInColumnInput {
	columnId: string;
	taskIds: string[];
}
