/**
 * Hardcoded allow-list of tools the server-side Planner may propose.
 *
 * The webapp owns the full tool registry (in
 * `apps/mana/apps/web/src/lib/data/tools/registry.ts`) and the policy
 * (`DEFAULT_AI_POLICY` in `data/ai/policy.ts`). This file mirrors the
 * subset where policy === 'propose' so the mana-ai Bun service can
 * build a valid prompt without importing Dexie-bound code.
 *
 * Drift risk: if the webapp adds a new proposable tool and this file
 * isn't updated, the mana-ai Planner simply won't suggest it — graceful
 * degradation. A contract test that compares both lists would be a
 * sensible follow-up.
 */

import type { AvailableTool } from '@mana/shared-ai';

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
];

export const AI_AVAILABLE_TOOL_NAMES = new Set<string>(AI_AVAILABLE_TOOLS.map((t) => t.name));
