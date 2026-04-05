/**
 * Todo module — collection accessors and guest seed data.
 *
 * Uses tables in the unified DB: tasks, todoProjects, labels, taskLabels, reminders, boardViews.
 */

import { db } from '$lib/data/database';
import type {
	LocalTask,
	LocalTaskTag,
	LocalReminder,
	LocalBoardView,
	LocalTodoProject,
} from './types';

// ─── Collection Accessors ──────────────────────────────────

export const taskTable = db.table<LocalTask>('tasks');
export const todoProjectTable = db.table<LocalTodoProject>('todoProjects');
export const taskTagTable = db.table<LocalTaskTag>('taskLabels'); // DB table still 'taskLabels' until schema migration
export const reminderTable = db.table<LocalReminder>('reminders');
export const boardViewTable = db.table<LocalBoardView>('boardViews');

// ─── Guest Seed ────────────────────────────────────────────

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);

export const TODO_GUEST_SEED = {
	boardViews: [
		{
			id: 'view-kanban',
			name: 'Kanban',
			icon: 'columns',
			groupBy: 'status' as const,
			layout: 'kanban' as const,
			order: 0,
			columns: [
				{
					id: 'col-todo',
					name: 'To Do',
					color: '#6B7280',
					match: { type: 'status' as const, value: 'pending' },
					onDrop: { setCompleted: false },
				},
				{
					id: 'col-done',
					name: 'Erledigt',
					color: '#22C55E',
					match: { type: 'status' as const, value: 'completed' },
					onDrop: { setCompleted: true },
				},
			],
		},
		{
			id: 'view-priority',
			name: 'Prioritaet',
			icon: 'flag',
			groupBy: 'priority' as const,
			layout: 'kanban' as const,
			order: 1,
			columns: [
				{
					id: 'col-pri-urgent',
					name: 'Dringend',
					color: '#EF4444',
					match: { type: 'priority' as const, value: 'urgent' },
					onDrop: { setPriority: 'urgent' as const },
				},
				{
					id: 'col-pri-high',
					name: 'Hoch',
					color: '#F59E0B',
					match: { type: 'priority' as const, value: 'high' },
					onDrop: { setPriority: 'high' as const },
				},
				{
					id: 'col-pri-medium',
					name: 'Mittel',
					color: '#3B82F6',
					match: { type: 'priority' as const, value: 'medium' },
					onDrop: { setPriority: 'medium' as const },
				},
				{
					id: 'col-pri-low',
					name: 'Niedrig',
					color: '#6B7280',
					match: { type: 'priority' as const, value: 'low' },
					onDrop: { setPriority: 'low' as const },
				},
			],
		},
	] satisfies LocalBoardView[],

	tasks: [
		{
			id: 'onboard-1',
			title: 'Willkommen bei Todo! Tippe hier, um diese Aufgabe zu bearbeiten',
			description: 'Du kannst Titel, Beschreibung, Prioritaet und Faelligkeitsdatum aendern.',
			priority: 'medium' as const,
			isCompleted: false,
			order: 0,
			subtasks: [
				{ id: 'sub-1', title: 'Titel bearbeiten', isCompleted: false, order: 0 },
				{ id: 'sub-2', title: 'Beschreibung hinzufuegen', isCompleted: false, order: 1 },
				{ id: 'sub-3', title: 'Prioritaet aendern', isCompleted: false, order: 2 },
			],
		},
		{
			id: 'onboard-2',
			title: 'Klicke den Kreis links, um diese Aufgabe abzuschliessen',
			priority: 'low' as const,
			isCompleted: false,
			order: 1,
		},
		{
			id: 'sample-1',
			title: 'Einkaufen gehen',
			description: 'Milch, Brot, Obst',
			priority: 'medium' as const,
			isCompleted: false,
			dueDate: tomorrow.toISOString(),
			order: 2,
			subtasks: [
				{ id: 'shop-1', title: 'Milch', isCompleted: false, order: 0 },
				{ id: 'shop-2', title: 'Brot', isCompleted: false, order: 1 },
				{ id: 'shop-3', title: 'Obst', isCompleted: false, order: 2 },
			],
		},
	] satisfies LocalTask[],
};
