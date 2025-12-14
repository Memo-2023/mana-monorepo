import type { ShortcutCategory, SyntaxGroup } from './types';

/**
 * Common keyboard shortcuts shared across all apps with InputBar
 */
export const COMMON_SHORTCUTS: ShortcutCategory[] = [
	{
		id: 'inputbar',
		title: 'Eingabefeld',
		shortcuts: [
			{
				keys: ['Enter'],
				description: 'Auswahl bestätigen / Erstellen',
				category: 'inputbar',
			},
			{
				keys: ['Cmd', 'Enter'],
				altKeys: ['Ctrl', 'Enter'],
				description: 'Direkt erstellen',
				category: 'inputbar',
			},
			{
				keys: ['Esc'],
				description: 'Schließen & Eingabe löschen',
				category: 'inputbar',
			},
			{
				keys: ['↑', '↓'],
				description: 'Durch Ergebnisse navigieren',
				category: 'inputbar',
			},
			{
				keys: ['Rechtsklick'],
				description: 'Einstellungen öffnen',
				category: 'inputbar',
			},
		],
	},
	{
		id: 'dialogs',
		title: 'Dialoge',
		shortcuts: [
			{
				keys: ['Esc'],
				description: 'Dialog schließen',
				category: 'dialogs',
			},
		],
	},
];

/**
 * Common syntax patterns shared across all apps with InputBar
 */
export const COMMON_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Kategorien & Tags',
		items: [
			{
				pattern: '#tag',
				description: 'Tag hinzufügen',
				examples: ['#arbeit', '#privat', '#wichtig'],
				color: 'primary',
			},
			{
				pattern: '@name',
				description: 'Kalender oder Projekt zuweisen',
				examples: ['@team', '@privat', '@projekt'],
				color: 'success',
			},
		],
	},
	{
		title: 'Zeit & Datum',
		items: [
			{
				pattern: 'Datum',
				description: 'Natürliche Datumsangaben',
				examples: ['heute', 'morgen', 'montag', 'in 3 tagen', 'nächste woche'],
				color: 'accent',
			},
			{
				pattern: 'Uhrzeit',
				description: 'Zeitangaben',
				examples: ['14:00', '9 uhr', 'um 15:30'],
				color: 'accent',
			},
		],
	},
	{
		title: 'Priorität',
		items: [
			{
				pattern: 'Priorität',
				description: 'Dringlichkeit festlegen',
				examples: [
					{ text: '!!!', label: 'dringend', color: 'error' },
					{ text: '!!', label: 'hoch', color: 'warning' },
					{ text: '!', label: 'normal', color: 'warning-soft' },
				],
				color: 'error',
			},
		],
	},
];

/**
 * Default live example for syntax highlighting demo
 */
export const DEFAULT_LIVE_EXAMPLE = {
	text: 'Meeting mit Team morgen 14:00 @arbeit #wichtig',
	highlights: [
		{ type: 'text' as const, content: 'Meeting mit Team ' },
		{ type: 'date' as const, content: 'morgen' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'time' as const, content: '14:00' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'reference' as const, content: '@arbeit' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'tag' as const, content: '#wichtig' },
	],
};
