/**
 * Todo-specific syntax help patterns for InputBar help modal
 */
import type { SyntaxGroup } from '@manacore/shared-ui';

export const TODO_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Aufgaben',
		items: [
			{
				pattern: 'Priorität',
				description: 'Dringlichkeit festlegen',
				examples: [
					{ text: '!!!', label: 'dringend', color: 'error' },
					{ text: '!!', label: 'hoch', color: 'warning' },
					{ text: 'normal', label: 'normal', color: 'warning-soft' },
					{ text: 'später', label: 'niedrig', color: 'success' },
				],
				color: 'error',
			},
			{
				pattern: '@Projekt',
				description: 'Projekt zuweisen',
				examples: ['@Arbeit', '@Privat', '@Einkauf'],
				color: 'success',
			},
			{
				pattern: 'Wiederholung',
				description: 'Wiederkehrende Aufgabe',
				examples: ['täglich', 'wöchentlich', 'jeden Montag', 'monatlich'],
				color: 'warning-soft',
			},
			{
				pattern: 'Subtasks',
				description: 'Unteraufgaben mit Doppelpunkt + Komma',
				examples: ['Einkaufen: Milch, Brot, Eier'],
				color: 'accent',
			},
		],
	},
];

export const TODO_LIVE_EXAMPLE = {
	text: 'Einkaufen: Milch, Brot morgen !! @Privat #wichtig',
	highlights: [
		{ type: 'text' as const, content: 'Einkaufen: Milch, Brot ' },
		{ type: 'date' as const, content: 'morgen' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'priority' as const, content: '!!' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'reference' as const, content: '@Privat' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'tag' as const, content: '#wichtig' },
	],
};
