import type { TaskStatus } from './task';

export interface KanbanColumn {
	id: string;
	userId: string;
	projectId?: string | null;
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
	color?: string;
	projectId?: string;
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
