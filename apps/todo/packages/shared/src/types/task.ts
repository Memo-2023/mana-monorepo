import type { Label } from './label';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
}

export interface TaskMetadata {
	notes?: string;
	attachments?: string[];
	linkedCalendarEventId?: string | null;
}

export interface Task {
	id: string;
	projectId?: string | null;
	userId: string;
	parentTaskId?: string | null;

	// Content
	title: string;
	description?: string | null;

	// Scheduling
	dueDate?: Date | string | null;
	dueTime?: string | null; // HH:mm format
	startDate?: Date | string | null;

	// Priority & Status
	priority: TaskPriority;
	status: TaskStatus;

	// Completion
	isCompleted: boolean;
	completedAt?: Date | string | null;

	// Ordering
	order: number;

	// Recurrence
	recurrenceRule?: string | null;
	recurrenceEndDate?: Date | string | null;
	lastOccurrence?: Date | string | null;

	// Subtasks
	subtasks?: Subtask[] | null;

	// Metadata
	metadata?: TaskMetadata | null;

	// Relations (populated on fetch)
	labels?: Label[];

	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateTaskInput {
	projectId?: string | null;
	parentTaskId?: string | null;
	title: string;
	description?: string;
	dueDate?: string | null;
	dueTime?: string | null;
	startDate?: string | null;
	priority?: TaskPriority;
	recurrenceRule?: string | null;
	recurrenceEndDate?: string | null;
	subtasks?: Omit<Subtask, 'id'>[];
	labelIds?: string[];
	metadata?: TaskMetadata;
}

export interface UpdateTaskInput {
	projectId?: string | null;
	parentTaskId?: string | null;
	title?: string;
	description?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	startDate?: string | null;
	priority?: TaskPriority;
	status?: TaskStatus;
	isCompleted?: boolean;
	order?: number;
	recurrenceRule?: string | null;
	recurrenceEndDate?: string | null;
	subtasks?: Subtask[] | null;
	metadata?: TaskMetadata | null;
}

export interface QueryTasksInput {
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

export interface ReorderTasksInput {
	taskIds: string[];
	projectId?: string | null;
}

export interface MoveTaskInput {
	projectId: string | null;
}

export interface UpdateTaskLabelsInput {
	labelIds: string[];
}

export interface UpdateSubtasksInput {
	subtasks: Subtask[];
}
