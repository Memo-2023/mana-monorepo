/**
 * NutriPhi-specific syntax help patterns
 */
import type { SyntaxGroup } from '@manacore/shared-ui';

export const NUTRIPHI_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Mahlzeiten',
		items: [
			{
				pattern: 'Mahlzeittyp',
				description: 'Art der Mahlzeit',
				examples: ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'],
				color: 'success',
			},
			{
				pattern: 'Mengen',
				description: 'Mengenangaben',
				examples: ['200g Reis', '2 Eier', '1 Scheibe Brot', '100ml Milch'],
				color: 'accent',
			},
			{
				pattern: 'Komma-Liste',
				description: 'Mehrere Zutaten mit Komma trennen',
				examples: ['Reis, Hähnchen, Brokkoli'],
				color: 'primary',
			},
		],
	},
];
