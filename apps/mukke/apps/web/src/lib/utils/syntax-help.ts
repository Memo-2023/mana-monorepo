/**
 * Mukke-specific syntax help patterns
 */
import type { SyntaxGroup } from '@manacore/shared-ui';

export const MUKKE_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Musik',
		items: [
			{
				pattern: 'Artist - Title',
				description: 'Interpret und Titel mit Bindestrich trennen',
				examples: ['Queen - Bohemian Rhapsody', 'Daft Punk ft. Pharrell - Get Lucky'],
				color: 'primary',
			},
			{
				pattern: '(Album)',
				description: 'Album in Klammern',
				examples: ['Queen - Song (A Night at the Opera)'],
				color: 'accent',
			},
			{
				pattern: '#genre',
				description: 'Genre als Tag',
				examples: ['#rock', '#electronic', '#jazz'],
				color: 'primary',
			},
			{
				pattern: 'BPM',
				description: 'Tempo in BPM',
				examples: ['120bpm', '90 BPM'],
				color: 'warning',
			},
			{
				pattern: 'Neue Playlist',
				description: 'Playlist erstellen',
				examples: ['Neue Playlist Workout', 'Playlist Chill'],
				color: 'success',
			},
			{
				pattern: 'Neues Projekt',
				description: 'Editor-Projekt erstellen',
				examples: ['Neues Projekt Demo', 'Projekt Remix'],
				color: 'success',
			},
		],
	},
];
