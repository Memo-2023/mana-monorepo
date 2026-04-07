/**
 * Suggestion Engine — Discovers potential automations by matching
 * entity names across modules (Habits ↔ Events, Tasks, Places).
 */

import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { ConditionOp } from './conditions';

export interface AutomationSuggestion {
	id: string;
	name: string;
	description: string;
	sourceApp: string;
	sourceCollection: string;
	sourceOp: 'insert';
	conditionField: string;
	conditionOp: ConditionOp;
	conditionValue: string;
	targetApp: string;
	targetAction: string;
	targetParams: Record<string, string>;
}

const MIN_MATCH_LENGTH = 4;

function titleContains(text: string, keyword: string): boolean {
	if (keyword.length < MIN_MATCH_LENGTH) return false;
	return text.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Generate automation suggestions by cross-matching entity names.
 * Excludes suggestions that already have a matching automation.
 */
export async function generateSuggestions(): Promise<AutomationSuggestion[]> {
	const suggestions: AutomationSuggestion[] = [];

	// Load habits
	const habits = await db
		.table('habits')
		.toArray()
		.then((all) =>
			all
				.filter((h: Record<string, unknown>) => !h.deletedAt && !h.isArchived)
				.map((h: Record<string, unknown>) => ({
					id: h.id as string,
					title: h.title as string,
					icon: (h.icon as string) ?? 'star',
				}))
		);

	if (habits.length === 0) return suggestions;

	// Load existing automations to avoid duplicate suggestions
	const existingAutos = await db
		.table('automations')
		.toArray()
		.then((all) => all.filter((a: Record<string, unknown>) => !a.deletedAt));

	function automationExists(
		sourceApp: string,
		sourceCollection: string,
		conditionValue: string,
		targetAction: string,
		habitId: string
	): boolean {
		return existingAutos.some(
			(a: Record<string, unknown>) =>
				a.sourceApp === sourceApp &&
				a.sourceCollection === sourceCollection &&
				a.targetAction === targetAction &&
				(a.targetParams as Record<string, string>)?.habitId === habitId &&
				String(a.conditionValue ?? '')
					.toLowerCase()
					.includes(conditionValue.toLowerCase())
		);
	}

	// ─── Events ↔ Habits ────────────────────────────────────
	// Title is encrypted on disk; we have to decrypt before string-matching
	// against habit titles. Filter on plaintext metadata first to keep the
	// decrypt batch small.
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	const rawBlocks = await db
		.table('timeBlocks')
		.toArray()
		.then((all: Record<string, unknown>[]) =>
			all.filter(
				(b) =>
					!b.deletedAt &&
					b.sourceModule === 'calendar' &&
					b.type === 'event' &&
					(b.startDate as string) >= thirtyDaysAgo
			)
		);
	const calendarBlocks = await decryptRecords('timeBlocks', rawBlocks);

	for (const habit of habits) {
		const matchingEvents = calendarBlocks.filter((e: Record<string, unknown>) =>
			titleContains(String(e.title ?? ''), habit.title)
		);

		if (
			matchingEvents.length > 0 &&
			!automationExists('calendar', 'events', habit.title, 'logHabit', habit.id)
		) {
			suggestions.push({
				id: `sug-cal-habit-${habit.id}`,
				name: `Kalender → ${habit.title}`,
				description: `Wenn ein Event mit "${habit.title}" erstellt wird, Habit automatisch loggen`,
				sourceApp: 'calendar',
				sourceCollection: 'events',
				sourceOp: 'insert',
				conditionField: 'title',
				conditionOp: 'contains',
				conditionValue: habit.title,
				targetApp: 'habits',
				targetAction: 'logHabit',
				targetParams: { habitId: habit.id },
			});
		}
	}

	// ─── Tasks ↔ Habits ─────────────────────────────────────
	// tasks.title is encrypted at rest — same decrypt-after-filter dance.
	const rawTasks = await db
		.table('tasks')
		.toArray()
		.then((all) => all.filter((t: Record<string, unknown>) => !t.deletedAt));
	const tasks = await decryptRecords('tasks', rawTasks);

	for (const habit of habits) {
		const matchingTasks = tasks.filter((t: Record<string, unknown>) =>
			titleContains(String(t.title ?? ''), habit.title)
		);

		if (
			matchingTasks.length > 0 &&
			!automationExists('todo', 'tasks', habit.title, 'logHabit', habit.id)
		) {
			suggestions.push({
				id: `sug-todo-habit-${habit.id}`,
				name: `Todo → ${habit.title}`,
				description: `Wenn eine Aufgabe mit "${habit.title}" erstellt wird, Habit automatisch loggen`,
				sourceApp: 'todo',
				sourceCollection: 'tasks',
				sourceOp: 'insert',
				conditionField: 'title',
				conditionOp: 'contains',
				conditionValue: habit.title,
				targetApp: 'habits',
				targetAction: 'logHabit',
				targetParams: { habitId: habit.id },
			});
		}
	}

	return suggestions;
}
