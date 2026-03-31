/**
 * Guest seed data for the Todo app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They serve as onboarding content that teaches the user how the app works.
 */

import type { LocalTask, LocalLabel, LocalBoardView } from './local-store';

export const guestLabels: LocalLabel[] = [
	{
		id: 'label-important',
		name: 'Wichtig',
		color: '#ef4444',
	},
	{
		id: 'label-idea',
		name: 'Idee',
		color: '#f59e0b',
	},
];

// ─── Board Views ────────────────────────────────────────────

export const guestBoardViews: LocalBoardView[] = [
	{
		id: 'view-kanban',
		name: 'Kanban',
		icon: 'columns',
		groupBy: 'status',
		layout: 'kanban',
		order: 0,
		columns: [
			{
				id: 'col-todo',
				name: 'To Do',
				color: '#6B7280',
				match: { type: 'status', value: 'pending' },
				onDrop: { setCompleted: false },
			},
			{
				id: 'col-done',
				name: 'Erledigt',
				color: '#22C55E',
				match: { type: 'status', value: 'completed' },
				onDrop: { setCompleted: true },
			},
		],
	},
	{
		id: 'view-eisenhower',
		name: 'Eisenhower',
		icon: 'grid-four',
		groupBy: 'custom',
		layout: 'grid',
		order: 1,
		columns: [
			{
				id: 'col-eis-ui',
				name: 'Wichtig & Dringend',
				color: '#EF4444',
				match: { type: 'custom', value: 'urgent-important' },
				onDrop: { setPriority: 'urgent' },
			},
			{
				id: 'col-eis-i',
				name: 'Wichtig',
				color: '#F59E0B',
				match: { type: 'custom', value: 'important' },
				onDrop: { setPriority: 'high' },
			},
			{
				id: 'col-eis-u',
				name: 'Dringend',
				color: '#3B82F6',
				match: { type: 'custom', value: 'urgent' },
				onDrop: { setPriority: 'medium' },
			},
			{
				id: 'col-eis-ni',
				name: 'Weder noch',
				color: '#6B7280',
				match: { type: 'custom', value: 'neither' },
				onDrop: { setPriority: 'low' },
			},
		],
	},
	{
		id: 'view-priority',
		name: 'Priorität',
		icon: 'flag',
		groupBy: 'priority',
		layout: 'kanban',
		order: 2,
		columns: [
			{
				id: 'col-pri-urgent',
				name: 'Dringend',
				color: '#EF4444',
				match: { type: 'priority', value: 'urgent' },
				onDrop: { setPriority: 'urgent' },
			},
			{
				id: 'col-pri-high',
				name: 'Hoch',
				color: '#F59E0B',
				match: { type: 'priority', value: 'high' },
				onDrop: { setPriority: 'high' },
			},
			{
				id: 'col-pri-medium',
				name: 'Mittel',
				color: '#3B82F6',
				match: { type: 'priority', value: 'medium' },
				onDrop: { setPriority: 'medium' },
			},
			{
				id: 'col-pri-low',
				name: 'Niedrig',
				color: '#6B7280',
				match: { type: 'priority', value: 'low' },
				onDrop: { setPriority: 'low' },
			},
		],
	},
	{
		id: 'view-due',
		name: 'Fälligkeit',
		icon: 'calendar',
		groupBy: 'dueDate',
		layout: 'kanban',
		order: 3,
		columns: [
			{
				id: 'col-due-overdue',
				name: 'Überfällig',
				color: '#EF4444',
				match: { type: 'dueDate', value: 'overdue' },
			},
			{
				id: 'col-due-today',
				name: 'Heute',
				color: '#F59E0B',
				match: { type: 'dueDate', value: 'today' },
			},
			{
				id: 'col-due-tomorrow',
				name: 'Morgen',
				color: '#3B82F6',
				match: { type: 'dueDate', value: 'tomorrow' },
			},
			{
				id: 'col-due-week',
				name: 'Diese Woche',
				color: '#8B5CF6',
				match: { type: 'dueDate', value: 'week' },
			},
			{
				id: 'col-due-later',
				name: 'Später',
				color: '#6B7280',
				match: { type: 'dueDate', value: 'later' },
			},
			{
				id: 'col-due-none',
				name: 'Ohne Datum',
				color: '#9CA3AF',
				match: { type: 'dueDate', value: 'none' },
			},
		],
	},
];

// ─── Task Seed Data ─────────────────────────────────────────

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 7);

export const guestTasks: LocalTask[] = [
	// ─── Onboarding Tasks ───────────────────────────────────
	{
		id: 'onboard-1',
		title: 'Willkommen bei Todo! Tippe hier, um diese Aufgabe zu bearbeiten ✏️',
		description:
			'Du kannst Titel, Beschreibung, Priorität und Fälligkeitsdatum ändern. Probiere es aus!',
		priority: 'medium',
		isCompleted: false,
		order: 0,
		subtasks: [
			{ id: 'sub-1', title: 'Titel bearbeiten', isCompleted: false, order: 0 },
			{ id: 'sub-2', title: 'Beschreibung hinzufügen', isCompleted: false, order: 1 },
			{ id: 'sub-3', title: 'Priorität ändern', isCompleted: false, order: 2 },
		],
	},
	{
		id: 'onboard-2',
		title: 'Klicke den Kreis links, um diese Aufgabe abzuschließen ✓',
		priority: 'low',
		isCompleted: false,
		order: 1,
	},
	{
		id: 'onboard-3',
		title: 'Erstelle eine neue Aufgabe mit dem + Button oben',
		priority: 'medium',
		isCompleted: false,
		order: 2,
	},
	{
		id: 'onboard-4',
		title: 'Wechsle zur Board-Ansicht über die Navigation',
		priority: 'low',
		isCompleted: false,
		order: 3,
	},
	{
		id: 'onboard-5',
		title: 'Melde dich an, um deine Aufgaben auf allen Geräten zu synchronisieren',
		description:
			'Ohne Anmeldung werden deine Daten nur in diesem Browser gespeichert. Mit einem Account synchronisieren wir sie automatisch.',
		priority: 'high',
		isCompleted: false,
		order: 4,
	},

	// ─── Sample Personal Tasks ──────────────────────────────
	{
		id: 'sample-1',
		title: 'Einkaufen gehen',
		description: 'Milch, Brot, Obst',
		priority: 'medium',
		isCompleted: false,
		dueDate: tomorrow.toISOString(),
		order: 0,
		subtasks: [
			{ id: 'shop-1', title: 'Milch', isCompleted: false, order: 0 },
			{ id: 'shop-2', title: 'Brot', isCompleted: false, order: 1 },
			{ id: 'shop-3', title: 'Obst', isCompleted: false, order: 2 },
		],
	},
	{
		id: 'sample-2',
		title: 'Wohnung aufräumen',
		priority: 'low',
		isCompleted: false,
		dueDate: nextWeek.toISOString(),
		order: 1,
	},
];
