/**
 * Demo Tasks - Static sample tasks for unauthenticated users
 *
 * Shows a realistic task list with various task types to demonstrate
 * the app's capabilities without requiring login.
 */

import type { Task } from '@todo/shared';
import { addDays, format, subDays } from 'date-fns';

/**
 * Generate demo tasks relative to the current date
 */
export function generateDemoTasks(): Task[] {
	const now = new Date();
	const today = format(now, 'yyyy-MM-dd');
	const tomorrow = format(addDays(now, 1), 'yyyy-MM-dd');
	const dayAfterTomorrow = format(addDays(now, 2), 'yyyy-MM-dd');
	const nextWeek = format(addDays(now, 7), 'yyyy-MM-dd');
	const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');

	const demoTasks: Task[] = [
		// Overdue task
		{
			id: 'demo_1',
			userId: 'demo',
			title: 'Steuererklärung abgeben',
			description: 'Alle Unterlagen zusammenstellen und online einreichen',
			dueDate: yesterday,
			priority: 'urgent',
			status: 'pending',
			isCompleted: false,
			order: 0,
			subtasks: [
				{ id: 'sub_1_1', title: 'Belege sammeln', isCompleted: true, order: 0 },
				{ id: 'sub_1_2', title: 'Formulare ausfüllen', isCompleted: true, order: 1 },
				{ id: 'sub_1_3', title: 'Online einreichen', isCompleted: false, order: 2 },
			],
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Today - high priority
		{
			id: 'demo_2',
			userId: 'demo',
			title: 'Präsentation vorbereiten',
			description: 'Slides für das Team-Meeting erstellen',
			dueDate: today,
			priority: 'high',
			status: 'in_progress',
			isCompleted: false,
			order: 1,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Today - medium priority
		{
			id: 'demo_3',
			userId: 'demo',
			title: 'E-Mails beantworten',
			dueDate: today,
			priority: 'medium',
			status: 'pending',
			isCompleted: false,
			order: 2,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Tomorrow
		{
			id: 'demo_4',
			userId: 'demo',
			title: 'Arzttermin',
			description: 'Jährliche Vorsorgeuntersuchung - Praxis Dr. Müller',
			dueDate: tomorrow,
			dueTime: '10:00',
			priority: 'high',
			status: 'pending',
			isCompleted: false,
			order: 3,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Day after tomorrow
		{
			id: 'demo_5',
			userId: 'demo',
			title: 'Einkaufsliste',
			priority: 'low',
			status: 'pending',
			isCompleted: false,
			order: 4,
			dueDate: dayAfterTomorrow,
			subtasks: [
				{ id: 'sub_5_1', title: 'Milch', isCompleted: false, order: 0 },
				{ id: 'sub_5_2', title: 'Brot', isCompleted: false, order: 1 },
				{ id: 'sub_5_3', title: 'Obst', isCompleted: false, order: 2 },
				{ id: 'sub_5_4', title: 'Gemüse', isCompleted: false, order: 3 },
			],
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Next week
		{
			id: 'demo_6',
			userId: 'demo',
			title: 'Wohnung aufräumen',
			description: 'Frühjahrsputz - alle Zimmer gründlich reinigen',
			dueDate: nextWeek,
			priority: 'medium',
			status: 'pending',
			isCompleted: false,
			order: 5,
			subtasks: [
				{ id: 'sub_6_1', title: 'Küche', isCompleted: false, order: 0 },
				{ id: 'sub_6_2', title: 'Bad', isCompleted: false, order: 1 },
				{ id: 'sub_6_3', title: 'Wohnzimmer', isCompleted: false, order: 2 },
				{ id: 'sub_6_4', title: 'Schlafzimmer', isCompleted: false, order: 3 },
			],
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// No due date (inbox)
		{
			id: 'demo_7',
			userId: 'demo',
			title: 'Buch "Atomic Habits" lesen',
			description: 'Kapitel 1-5 diese Woche',
			priority: 'low',
			status: 'pending',
			isCompleted: false,
			order: 6,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Completed task
		{
			id: 'demo_8',
			userId: 'demo',
			title: 'Fitnessstudio anmelden',
			priority: 'medium',
			status: 'completed',
			isCompleted: true,
			completedAt: subDays(now, 2).toISOString(),
			order: 7,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Another completed
		{
			id: 'demo_9',
			userId: 'demo',
			title: 'Geburtstagsgeschenk kaufen',
			description: 'Für Lisa - sie mag Bücher und Tee',
			priority: 'high',
			status: 'completed',
			isCompleted: true,
			completedAt: subDays(now, 1).toISOString(),
			order: 8,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
		// Work task
		{
			id: 'demo_10',
			userId: 'demo',
			title: 'Code Review für PR #42',
			description: 'Feature-Branch von Max reviewen',
			dueDate: tomorrow,
			priority: 'medium',
			status: 'pending',
			isCompleted: false,
			order: 9,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		},
	];

	return demoTasks;
}

/**
 * Check if a task ID is a demo task
 */
export function isDemoTask(id: string): boolean {
	return id.startsWith('demo_');
}
