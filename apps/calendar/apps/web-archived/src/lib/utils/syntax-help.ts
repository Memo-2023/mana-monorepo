/**
 * Calendar-specific syntax help patterns for InputBar help modal
 */
import type { SyntaxGroup } from '@manacore/shared-ui';

export const CALENDAR_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Kalender-Termin',
		items: [
			{
				pattern: 'Dauer',
				description: 'Termindauer angeben',
				examples: ['1h', '30min', '2h30m', '1 Stunde'],
				color: 'accent',
			},
			{
				pattern: 'Zeitbereich',
				description: 'Start- und Endzeit',
				examples: ['14-16 Uhr', '10:00-11:30', '9-17 Uhr'],
				color: 'accent',
			},
			{
				pattern: 'Ganztägig',
				description: 'Ganztägiger Termin',
				examples: ['ganztägig', 'ganzer Tag'],
				color: 'warning',
			},
			{
				pattern: 'Ort',
				description: 'Ort angeben',
				examples: ['in Berlin', 'im Büro', 'bei Dr. Müller'],
				color: 'success',
			},
			{
				pattern: 'Wiederholung',
				description: 'Wiederkehrende Termine',
				examples: ['täglich', 'wöchentlich', 'jeden Montag', 'monatlich'],
				color: 'warning-soft',
			},
			{
				pattern: '@Kalender',
				description: 'Kalender zuweisen',
				examples: ['@Arbeit', '@Privat'],
				color: 'success',
			},
			{
				pattern: '@Teilnehmer',
				description: 'Teilnehmer hinzufügen',
				examples: ['@Max', '@Anna'],
				color: 'success',
			},
		],
	},
];

export const CALENDAR_LIVE_EXAMPLE = {
	text: 'Teammeeting morgen 14-16 Uhr wöchentlich @Arbeit #wichtig',
	highlights: [
		{ type: 'text' as const, content: 'Teammeeting ' },
		{ type: 'date' as const, content: 'morgen' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'time' as const, content: '14-16 Uhr' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'date' as const, content: 'wöchentlich' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'reference' as const, content: '@Arbeit' },
		{ type: 'text' as const, content: ' ' },
		{ type: 'tag' as const, content: '#wichtig' },
	],
};
