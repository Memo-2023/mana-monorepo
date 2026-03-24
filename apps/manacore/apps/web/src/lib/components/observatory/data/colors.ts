// Natural color palette for the Seenplatte ecosystem

export const sky = {
	dayTop: '#87CEEB',
	dayBottom: '#E0F0FF',
	duskTop: '#2C1654',
	duskBottom: '#E8956A',
	nightTop: '#0B1026',
	nightBottom: '#1A2444',
} as const;

export const mountains = {
	far: '#8BA4B8',
	mid: '#6B8A9E',
	near: '#4A7085',
	snow: '#E8F0F4',
} as const;

export const water = {
	shallow: '#7EC8D9',
	mid: '#4BA3B5',
	deep: '#2A7A8C',
	veryDeep: '#1A5666',
	river: '#5BB5C5',
	highlight: '#A8E4F0',
	foam: '#E8F6FA',
} as const;

export const terrain = {
	meadow: '#7DB86A',
	meadowLight: '#96CC86',
	meadowDark: '#5E9A4D',
	shore: '#C4B48A',
	shoreDark: '#A89870',
	path: '#D4C4A0',
	rock: '#8C8C80',
	rockLight: '#A8A89C',
} as const;

export const vegetation = {
	// Tree health colors based on ManaScore
	healthyDark: '#2D6B30',
	healthy: '#3E8B42',
	healthyLight: '#5AAB5E',
	moderate: '#7DB86A',
	warning: '#C4B848',
	stressed: '#D4944A',
	critical: '#B85C4A',

	// Specific plant colors
	trunk: '#6B4E3D',
	trunkLight: '#8B6E5D',
	reed: '#7DA868',
	reedDark: '#5A8548',
	lilyPad: '#4A8B50',
	lilyFlower: '#E8B0D0',
	lilyFlowerCenter: '#F0D060',
	moss: '#5A8B4A',
	mossLight: '#78A868',
	sprout: '#90C880',
	sproutStake: '#A89070',
} as const;

/**
 * Get tree crown color based on ManaScore (0-100)
 */
export function getHealthColor(score: number): string {
	if (score >= 85) return vegetation.healthyDark;
	if (score >= 70) return vegetation.healthy;
	if (score >= 55) return vegetation.moderate;
	if (score >= 40) return vegetation.warning;
	if (score >= 25) return vegetation.stressed;
	return vegetation.critical;
}

/**
 * Get water clarity based on error rate (0 = clear, 1 = murky)
 */
export function getWaterColor(clarity: number): string {
	if (clarity > 0.8) return water.shallow;
	if (clarity > 0.5) return water.mid;
	if (clarity > 0.2) return water.deep;
	return water.veryDeep;
}
