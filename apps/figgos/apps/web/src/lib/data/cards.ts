import type { FigureRarity } from '@figgos/shared';

export interface CardData {
	id: string;
	name: string;
	subtitle: string;
	description: string;
	rarity: FigureRarity;
	image: string;
	stats: { attack: number; defense: number; special: number };
}

export const CARDS: CardData[] = [
	{
		id: 'cole-epic',
		name: 'Detective Cole',
		subtitle: 'Noir City Homicide Division',
		description:
			'A hardboiled detective who has seen it all. Armed with nothing but a trench coat, a sharp mind, and an unhealthy coffee addiction. Solves impossible cases in the rain-soaked streets of Noir City.',
		rarity: 'epic',
		image: '/images/cole-epic.png',
		stats: { attack: 42, defense: 68, special: 75 },
	},
	{
		id: 'cole-rare',
		name: 'Detective Cole',
		subtitle: 'Noir City Homicide Division',
		description:
			'Fresh off his first big case, Cole is making a name for himself in the precinct. His instincts are sharp, but he still has a lot to learn about the darker side of Noir City.',
		rarity: 'rare',
		image: '/images/cole-rare.png',
		stats: { attack: 35, defense: 52, special: 60 },
	},
	{
		id: 'cole-legendary',
		name: 'Detective Cole',
		subtitle: 'Noir City Homicide Division',
		description:
			'The legend of Noir City. After decades on the force, Cole has become the detective other detectives tell stories about. His case closure rate is unmatched in the history of the division.',
		rarity: 'legendary',
		image: '/images/cole-legendary.png',
		stats: { attack: 78, defense: 85, special: 95 },
	},
	{
		id: 'cole-common',
		name: 'Detective Cole',
		subtitle: 'Noir City Homicide Division',
		description:
			'A standard-issue detective doing his best in a tough city. Nothing fancy, but reliable. Shows up every day, drinks too much coffee, and gets the job done.',
		rarity: 'common',
		image: '/images/cole-common.png',
		stats: { attack: 22, defense: 30, special: 28 },
	},
	{
		id: 'cole-kraft',
		name: 'Detective Cole',
		subtitle: 'Kraft Edition',
		description:
			"Limited kraft paper edition. A collector's item with a vintage feel. The same old Cole, but with that handmade, artisanal charm that cardboard enthusiasts crave.",
		rarity: 'common',
		image: '/images/cole-kraft.png',
		stats: { attack: 25, defense: 32, special: 30 },
	},
];
