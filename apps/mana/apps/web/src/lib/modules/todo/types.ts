/**
 * Todo module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';
import type { Tag } from '@mana/shared-tags';

/**
 * A tag attached to a task. Structurally identical to the shared `Tag`
 * type — the alias exists so todo code can read `TaskTag` without colliding
 * with the `Tag` icon from `@mana/shared-icons` that several views import.
 */
export type TaskTag = Tag;

// ─── Local Types (IndexedDB) ──────────────────────────────

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface LocalTask extends BaseRecord {
	title: string;
	description?: string;
	projectId?: string | null;
	priority: TaskPriority;
	isCompleted: boolean;
	completedAt?: string | null;
	dueDate?: string | null;
	scheduledBlockId?: string | null; // TimeBlock ID when task is scheduled on calendar
	estimatedDuration?: number | null;
	order: number;
	// recurrenceRule lives on the TimeBlock (via scheduledBlockId)
	subtasks?: Subtask[] | null;
	metadata?: Record<string, unknown>;
}

export interface LocalTaskTag extends BaseRecord {
	taskId: string;
	tagId: string;
}

export interface LocalReminder extends BaseRecord {
	taskId: string;
	minutesBefore: number;
	type: 'push' | 'email' | 'both';
	status: 'pending' | 'sent' | 'failed';
}

// ─── Board Views ────────────────────────────────────────────

export interface TaskMatcher {
	type: 'status' | 'priority' | 'tag' | 'dueDate' | 'custom';
	value?: string | null;
	taskIds?: string[];
}

export interface DropAction {
	setCompleted?: boolean;
	setPriority?: TaskPriority;
}

export interface ViewColumn {
	id: string;
	name: string;
	color: string;
	match: TaskMatcher;
	onDrop?: DropAction;
}

export interface ViewFilter {
	tagIds?: string[];
	priorities?: string[];
}

export interface LocalBoardView extends BaseRecord {
	name: string;
	icon: string;
	groupBy: 'status' | 'priority' | 'dueDate' | 'tag' | 'custom';
	columns: ViewColumn[];
	filter?: ViewFilter;
	layout: 'kanban' | 'grid' | 'fokus';
	order: number;
}

export interface LocalTodoProject extends BaseRecord {
	name: string;
	color?: string | null;
	icon?: string | null;
	order: number;
	isArchived?: boolean;
	isDefault?: boolean;
}

// ─── Shared Task Type ──────────────────────────────────────

export interface Task {
	id: string;
	projectId?: string | null;
	title: string;
	description?: string | null;
	dueDate?: string | null;
	scheduledBlockId?: string | null;
	estimatedDuration?: number | null;
	priority: TaskPriority;
	status: TaskStatus;
	isCompleted: boolean;
	completedAt?: string | null;
	order: number;
	// recurrenceRule lives on the TimeBlock (via scheduledBlockId)
	subtasks?: Subtask[] | null;
	metadata?: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'label' | 'completed' | 'search';
export type SortBy = 'dueDate' | 'priority' | 'title' | 'createdAt' | 'order';
export type SortOrder = 'asc' | 'desc';
