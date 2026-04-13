import type { ModuleTool } from '$lib/data/tools/types';
import { journalStore } from './stores/journal.svelte';
import type { JournalMood } from './types';

const MOOD_ENUM = [
	'dankbar',
	'glücklich',
	'zufrieden',
	'neutral',
	'nachdenklich',
	'traurig',
	'gestresst',
	'wütend',
];

export const journalTools: ModuleTool[] = [
	{
		name: 'create_journal_entry',
		module: 'journal',
		description:
			'Erstellt einen neuen Journal-Eintrag mit optionaler Stimmung (dankbar, glücklich, zufrieden, neutral, nachdenklich, traurig, gestresst, wütend)',
		parameters: [
			{ name: 'content', type: 'string', description: 'Inhalt des Eintrags', required: true },
			{ name: 'title', type: 'string', description: 'Optionaler Titel', required: false },
			{ name: 'mood', type: 'string', description: 'Stimmung', required: false, enum: MOOD_ENUM },
		],
		async execute(params) {
			const entry = await journalStore.createEntry({
				content: params.content as string,
				title: params.title as string | undefined,
				mood: params.mood as JournalMood | undefined,
			});
			return {
				success: true,
				data: entry,
				message: `Journal-Eintrag erstellt${params.mood ? ` (Stimmung: ${params.mood})` : ''}`,
			};
		},
	},
	{
		name: 'set_mood',
		module: 'journal',
		description: 'Erstellt einen Journal-Eintrag mit Stimmung',
		parameters: [
			{ name: 'mood', type: 'string', description: 'Stimmung', required: true, enum: MOOD_ENUM },
		],
		async execute(params) {
			const entry = await journalStore.createEntry({
				mood: params.mood as JournalMood,
			});
			return { success: true, data: entry, message: `Stimmung: ${params.mood}` };
		},
	},
];
