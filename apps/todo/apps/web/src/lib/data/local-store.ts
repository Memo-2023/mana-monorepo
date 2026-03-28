/**
 * Todo App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Todo data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import type { Subtask as SharedSubtask } from '@todo/shared';
import { guestProjects, guestTasks, guestLabels, guestBoardViews } from './guest-seed.js';

// ─── Types ──────────────────────────────────────────────────

export interface LocalTask extends BaseRecord {
	title: string;
	description?: string;
	projectId?: string | null;
	userId?: string;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	isCompleted: boolean;
	completedAt?: string | null;
	dueDate?: string | null;
	scheduledDate?: string | null;
	scheduledStartTime?: string | null;
	estimatedDuration?: number | null;
	order: number;
	recurrenceRule?: string | null;
	subtasks?: SharedSubtask[] | null;
	metadata?: Record<string, unknown>;
}

export type { SharedSubtask as Subtask };

export interface LocalProject extends BaseRecord {
	name: string;
	color: string;
	icon?: string | null;
	userId?: string;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
}

export interface LocalLabel extends BaseRecord {
	name: string;
	color: string;
	userId?: string;
}

export interface LocalTaskLabel extends BaseRecord {
	taskId: string;
	labelId: string;
}

export interface LocalReminder extends BaseRecord {
	taskId: string;
	userId?: string;
	minutesBefore: number;
	type: 'push' | 'email' | 'both';
	status: 'pending' | 'sent' | 'failed';
}

// ─── Board Views ────────────────────────────────────────────

export interface TaskMatcher {
	type: 'status' | 'priority' | 'project' | 'tag' | 'dueDate' | 'custom';
	value?: string | null;
	/** For 'custom' groupBy: manually assigned task IDs */
	taskIds?: string[];
}

export interface DropAction {
	setCompleted?: boolean;
	setPriority?: 'low' | 'medium' | 'high' | 'urgent';
	setProjectId?: string | null;
}

export interface ViewColumn {
	id: string;
	name: string;
	color: string;
	match: TaskMatcher;
	onDrop?: DropAction;
}

export interface ViewFilter {
	projectId?: string;
	tagIds?: string[];
	priorities?: string[];
}

export interface LocalBoardView extends BaseRecord {
	name: string;
	icon: string;
	groupBy: 'status' | 'priority' | 'project' | 'dueDate' | 'tag' | 'custom';
	columns: ViewColumn[];
	filter?: ViewFilter;
	layout: 'kanban' | 'grid';
	order: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const todoStore = createLocalStore({
	appId: 'todo',
	collections: [
		{
			name: 'tasks',
			indexes: [
				'projectId',
				'dueDate',
				'isCompleted',
				'priority',
				'order',
				'[isCompleted+order]',
				'[projectId+order]',
			],
			guestSeed: guestTasks,
		},
		{
			name: 'projects',
			indexes: ['order', 'isArchived'],
			guestSeed: guestProjects,
		},
		{
			name: 'labels',
			indexes: [],
			guestSeed: guestLabels,
		},
		{
			name: 'taskLabels',
			indexes: ['taskId', 'labelId'],
		},
		{
			name: 'reminders',
			indexes: ['taskId'],
		},
		{
			name: 'boardViews',
			indexes: ['order', 'groupBy'],
			guestSeed: guestBoardViews,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const taskCollection = todoStore.collection<LocalTask>('tasks');
export const projectCollection = todoStore.collection<LocalProject>('projects');
export const labelCollection = todoStore.collection<LocalLabel>('labels');
export const taskLabelCollection = todoStore.collection<LocalTaskLabel>('taskLabels');
export const reminderCollection = todoStore.collection<LocalReminder>('reminders');
export const boardViewCollection = todoStore.collection<LocalBoardView>('boardViews');
