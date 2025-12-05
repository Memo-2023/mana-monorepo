import type { FigureRarity } from '../types/figure';

/**
 * Rarity configuration with display info and probabilities
 */
export const RARITY_CONFIG: Record<
	FigureRarity,
	{
		label: string;
		color: string;
		bgColor: string;
		borderColor: string;
		probability: number;
	}
> = {
	common: {
		label: 'Common',
		color: '#9CA3AF',
		bgColor: 'rgba(156, 163, 175, 0.1)',
		borderColor: 'rgba(156, 163, 175, 0.3)',
		probability: 0.6,
	},
	rare: {
		label: 'Rare',
		color: '#3B82F6',
		bgColor: 'rgba(59, 130, 246, 0.1)',
		borderColor: 'rgba(59, 130, 246, 0.3)',
		probability: 0.25,
	},
	epic: {
		label: 'Epic',
		color: '#8B5CF6',
		bgColor: 'rgba(139, 92, 246, 0.1)',
		borderColor: 'rgba(139, 92, 246, 0.3)',
		probability: 0.12,
	},
	legendary: {
		label: 'Legendary',
		color: '#F59E0B',
		bgColor: 'rgba(245, 158, 11, 0.1)',
		borderColor: 'rgba(245, 158, 11, 0.3)',
		probability: 0.03,
	},
};

/**
 * All rarity levels in order from common to legendary
 */
export const RARITY_ORDER: FigureRarity[] = ['common', 'rare', 'epic', 'legendary'];

/**
 * Get rarity config by level
 */
export function getRarityConfig(rarity: FigureRarity) {
	return RARITY_CONFIG[rarity];
}

/**
 * Get random rarity based on probabilities
 */
export function getRandomRarity(): FigureRarity {
	const random = Math.random();
	let cumulative = 0;

	for (const rarity of RARITY_ORDER) {
		cumulative += RARITY_CONFIG[rarity].probability;
		if (random <= cumulative) {
			return rarity;
		}
	}

	return 'common';
}
