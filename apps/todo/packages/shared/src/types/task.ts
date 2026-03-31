import type { Label } from './label';
import type { ContactReference } from '@manacore/shared-types';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
}

export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface EffectiveDuration {
	value: number;
	unit: DurationUnit;
}

export interface TaskMetadata {
	attachments?: string[];
	linkedCalendarEventId?: string | null;
	// Agile/Productivity metadata
	storyPoints?: number | null; // Fibonacci: 1, 2, 3, 5, 8, 13, 21
	effectiveDuration?: EffectiveDuration | null; // Actual time spent
	funRating?: number | null; // 1-10 scale
	// Contact associations
	assignee?: ContactReference | null; // Person responsible for the task
	involvedContacts?: ContactReference[]; // Other people involved
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

	// Time-Blocking (for calendar integration)
	scheduledDate?: Date | string | null; // Date when task is scheduled
	scheduledStartTime?: string | null; // HH:mm format - when to start
	scheduledEndTime?: string | null; // HH:mm format - when to end
	estimatedDuration?: number | null; // Duration in minutes

	// Priority & Status
	priority: TaskPriority;
	status: TaskStatus;

	// Completion
	isCompleted: boolean;
	completedAt?: Date | string | null;

	// Ordering
	order: number;

	// Kanban
	columnId?: string | null;
	columnOrder?: number;

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
	// Time-Blocking
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	scheduledEndTime?: string | null;
	estimatedDuration?: number | null;
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
	// Time-Blocking
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	scheduledEndTime?: string | null;
	estimatedDuration?: number | null;
	priority?: TaskPriority;
	status?: TaskStatus;
	isCompleted?: boolean;
	order?: number;
	recurrenceRule?: string | null;
	recurrenceEndDate?: string | null;
	subtasks?: Subtask[] | null;
	metadata?: TaskMetadata | null;
	labelIds?: string[];
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
