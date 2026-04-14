/**
 * Hardcoded allow-list of tools the server-side Planner may propose.
 *
 * Parameter shapes live here (the webapp owns the full Dexie-bound
 * registry); the set of NAMES is shared via `@mana/shared-ai`'s
 * `AI_PROPOSABLE_TOOL_NAMES`. The module-load assertion at the bottom
 * guards against drift in either direction — if this file or the shared
 * list falls out of sync, the service refuses to start.
 */

import { AI_PROPOSABLE_TOOL_SET, type AvailableTool } from '@mana/shared-ai';

export const AI_AVAILABLE_TOOLS: readonly AvailableTool[] = [
	{
		name: 'create_task',
		module: 'todo',
		description: 'Erstellt einen neuen Task mit optionalem Faelligkeitsdatum und Prioritaet',
		parameters: [
			{ name: 'title', type: 'string', description: 'Titel des Tasks', required: true },
			{
				name: 'dueDate',
				type: 'string',
				description: 'Faelligkeitsdatum (YYYY-MM-DD)',
				required: false,
			},
			{
				name: 'priority',
				type: 'string',
				description: 'Prioritaet',
				required: false,
				enum: ['low', 'medium', 'high'],
			},
			{ name: 'description', type: 'string', description: 'Beschreibung', required: false },
		],
	},
	{
		name: 'complete_task',
		module: 'todo',
		description: 'Markiert einen Task als erledigt',
		parameters: [{ name: 'taskId', type: 'string', description: 'ID des Tasks', required: true }],
	},
	{
		name: 'complete_tasks_by_title',
		module: 'todo',
		description: 'Markiert alle Tasks deren Titel den Substring enthält (case-insensitive)',
		parameters: [
			{
				name: 'titleSubstring',
				type: 'string',
				description: 'Teil des Task-Titels',
				required: true,
			},
		],
	},
	{
		name: 'create_event',
		module: 'calendar',
		description: 'Erstellt einen Kalender-Event',
		parameters: [
			{ name: 'title', type: 'string', description: 'Event-Titel', required: true },
			{ name: 'startIso', type: 'string', description: 'Start (ISO)', required: true },
			{ name: 'endIso', type: 'string', description: 'Ende (ISO)', required: false },
		],
	},
	{
		name: 'create_place',
		module: 'places',
		description: 'Fügt einen neuen Ort hinzu',
		parameters: [
			{ name: 'name', type: 'string', description: 'Name des Ortes', required: true },
			{ name: 'category', type: 'string', description: 'Kategorie', required: false },
		],
	},
	{
		name: 'visit_place',
		module: 'places',
		description: 'Vermerkt einen Besuch an einem bereits erfassten Ort',
		parameters: [{ name: 'placeId', type: 'string', description: 'ID des Ortes', required: true }],
	},
	{
		name: 'undo_drink',
		module: 'drink',
		description: 'Macht den letzten Drink-Eintrag rückgängig',
		parameters: [],
	},
];

export const AI_AVAILABLE_TOOL_NAMES = new Set<string>(AI_AVAILABLE_TOOLS.map((t) => t.name));

// ── Contract check — runs on module load ───────────────────
// Catches drift between this file and @mana/shared-ai's canonical
// proposable list. A mismatch means the webapp's policy + mana-ai are
// about to disagree; better fail fast than ship a silently-degraded AI.
{
	const extra = [...AI_AVAILABLE_TOOL_NAMES].filter((n) => !AI_PROPOSABLE_TOOL_SET.has(n));
	const missing = [...AI_PROPOSABLE_TOOL_SET].filter((n) => !AI_AVAILABLE_TOOL_NAMES.has(n));
	if (extra.length || missing.length) {
		throw new Error(
			`[mana-ai] AI_AVAILABLE_TOOLS drift vs AI_PROPOSABLE_TOOL_NAMES. ` +
				`extra=${JSON.stringify(extra)} missing=${JSON.stringify(missing)}`
		);
	}
}
