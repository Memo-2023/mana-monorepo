/**
 * Plants-specific syntax help patterns
 */
import type { SyntaxGroup } from '@mana/shared-ui';

export const PLANTS_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Pflanzen',
		items: [
			{
				pattern: 'Pflege',
				description: 'Pflege-Aktion loggen',
				examples: ['Monstera gegossen', 'Ficus umgetopft', 'Rose geduengt'],
				color: 'success',
			},
			{
				pattern: 'Erworben',
				description: 'Erwerbsdatum angeben',
				examples: ['gekauft', 'gepflanzt', 'bekommen'],
				color: 'accent',
			},
		],
	},
];
