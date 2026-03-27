/**
 * Guest seed data for the Todo app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They serve as onboarding content that teaches the user how the app works.
 */

import type { LocalTask, LocalProject, LocalLabel } from './local-store';

const ONBOARDING_PROJECT_ID = 'onboarding-project';
const PERSONAL_PROJECT_ID = 'personal-project';

export const guestProjects: LocalProject[] = [
	{
		id: ONBOARDING_PROJECT_ID,
		name: 'Erste Schritte',
		color: '#3b82f6',
		icon: 'sparkle',
		order: 0,
		isArchived: false,
		isDefault: false,
	},
	{
		id: PERSONAL_PROJECT_ID,
		name: 'Persönlich',
		color: '#10b981',
		icon: 'home',
		order: 1,
		isArchived: false,
		isDefault: true,
	},
];

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
		projectId: ONBOARDING_PROJECT_ID,
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
		projectId: ONBOARDING_PROJECT_ID,
		priority: 'low',
		isCompleted: false,
		order: 1,
	},
	{
		id: 'onboard-3',
		title: 'Erstelle eine neue Aufgabe mit dem + Button oben',
		projectId: ONBOARDING_PROJECT_ID,
		priority: 'medium',
		isCompleted: false,
		order: 2,
	},
	{
		id: 'onboard-4',
		title: 'Wechsle zur Kanban-Ansicht über die Navigation',
		projectId: ONBOARDING_PROJECT_ID,
		priority: 'low',
		isCompleted: false,
		order: 3,
	},
	{
		id: 'onboard-5',
		title: 'Melde dich an, um deine Aufgaben auf allen Geräten zu synchronisieren',
		description:
			'Ohne Anmeldung werden deine Daten nur in diesem Browser gespeichert. Mit einem Account synchronisieren wir sie automatisch.',
		projectId: ONBOARDING_PROJECT_ID,
		priority: 'high',
		isCompleted: false,
		order: 4,
	},

	// ─── Sample Personal Tasks ──────────────────────────────
	{
		id: 'sample-1',
		title: 'Einkaufen gehen',
		description: 'Milch, Brot, Obst',
		projectId: PERSONAL_PROJECT_ID,
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
		projectId: PERSONAL_PROJECT_ID,
		priority: 'low',
		isCompleted: false,
		dueDate: nextWeek.toISOString(),
		order: 1,
	},
];
