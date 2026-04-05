/**
 * Inline Suggestion — Checks if a newly created record matches
 * a known entity in another module and suggests an automation.
 *
 * Called from Dexie hooks. Emits a CustomEvent that the UI catches.
 */

import { db } from '$lib/data/database';
import type { AutomationSuggestion } from './suggestions';

const MIN_MATCH_LENGTH = 4;
const DISMISSED_KEY = 'mana:dismissed-suggestions';

function getDismissed(): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'));
	} catch {
		return new Set();
	}
}

export function dismissSuggestion(id: string): void {
	const dismissed = getDismissed();
	dismissed.add(id);
	localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

export function isSuggestionDismissed(id: string): boolean {
	return getDismissed().has(id);
}

/**
 * Check if a newly created record should trigger an inline suggestion.
 * Returns null if no match or suggestion already dismissed/automated.
 */
export async function checkInlineSuggestion(
	appId: string,
	collection: string,
	data: Record<string, unknown>
): Promise<AutomationSuggestion | null> {
	const title = String(data.title ?? data.name ?? '').trim();
	if (title.length < MIN_MATCH_LENGTH) return null;

	// Only check specific source combinations
	const isEvent = appId === 'calendar' && collection === 'events';
	const isTask = appId === 'todo' && collection === 'tasks';
	if (!isEvent && !isTask) return null;

	// Load habits to match against
	const habits = await db
		.table('habits')
		.toArray()
		.then((all) =>
			all
				.filter((h: Record<string, unknown>) => !h.deletedAt && !h.isArchived)
				.map((h: Record<string, unknown>) => ({
					id: h.id as string,
					title: h.title as string,
				}))
		);

	// Find matching habit
	const matchedHabit = habits.find(
		(h) => h.title.length >= MIN_MATCH_LENGTH && title.toLowerCase().includes(h.title.toLowerCase())
	);
	if (!matchedHabit) return null;

	const sugId = `inline-${appId}-habit-${matchedHabit.id}`;

	// Skip if dismissed
	if (isSuggestionDismissed(sugId)) return null;

	// Skip if automation already exists for this pair
	const existingAutos = await db
		.table('automations')
		.toArray()
		.then((all) => all.filter((a: Record<string, unknown>) => !a.deletedAt && a.enabled));

	const alreadyAutomated = existingAutos.some(
		(a: Record<string, unknown>) =>
			a.sourceApp === appId &&
			a.sourceCollection === collection &&
			a.targetAction === 'logHabit' &&
			(a.targetParams as Record<string, string>)?.habitId === matchedHabit.id
	);
	if (alreadyAutomated) return null;

	const sourceLabel = isEvent ? 'Kalender-Event' : 'Aufgabe';

	return {
		id: sugId,
		name: `${sourceLabel} → ${matchedHabit.title}`,
		description: `"${matchedHabit.title}" automatisch als Habit loggen wenn ${sourceLabel} erstellt wird?`,
		sourceApp: appId,
		sourceCollection: collection,
		sourceOp: 'insert',
		conditionField: 'title',
		conditionOp: 'contains',
		conditionValue: matchedHabit.title,
		targetApp: 'habits',
		targetAction: 'logHabit',
		targetParams: { habitId: matchedHabit.id },
	};
}
