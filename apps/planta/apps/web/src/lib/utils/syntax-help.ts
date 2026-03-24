/**
 * Planta-specific syntax help patterns
 */
import type { SyntaxGroup } from '@manacore/shared-ui';

export const PLANTA_SYNTAX: SyntaxGroup[] = [
	{
		title: 'Pflanzen',
		items: [
			{
				pattern: 'Pflege',
				description: 'Pflege-Aktion loggen',
				examples: ['Monstera gegossen', 'Ficus umgetopft', 'Rose gedüngt'],
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
