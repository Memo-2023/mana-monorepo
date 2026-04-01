/**
 * 24 preset moods matching the mobile app.
 */

import type { Mood } from './types';

export const DEFAULT_MOODS: Mood[] = [
	{
		id: 'fire',
		name: 'Fire',
		colors: ['#ff6b35', '#ff4500', '#dc143c', '#8b0000'],
		animationType: 'candle',
		order: 0,
	},
	{
		id: 'breath',
		name: 'Breath',
		colors: ['#667eea', '#764ba2', '#f093fb'],
		animationType: 'breath',
		order: 1,
	},
	{
		id: 'northern-lights',
		name: 'Northern Lights',
		colors: ['#5f27cd', '#341f97', '#8854d0', '#a29bfe'],
		animationType: 'wave',
		order: 2,
	},
	{
		id: 'thunder',
		name: 'Thunder',
		colors: ['#2c3e50', '#34495e', '#ffffff', '#95a5a6'],
		animationType: 'thunder',
		order: 3,
	},
	{
		id: 'light',
		name: 'Light',
		colors: ['#ffffff', '#f8f9fa', '#e9ecef'],
		animationType: 'gradient',
		order: 4,
	},
	{
		id: 'flash',
		name: 'Flash',
		colors: ['#ffffff'],
		animationType: 'flash',
		order: 5,
	},
	{
		id: 'sos',
		name: 'SOS',
		colors: ['#ffffff'],
		animationType: 'sos',
		order: 6,
	},
	{
		id: 'ocean',
		name: 'Ocean',
		colors: ['#48dbfb', '#0abde3', '#10ac84', '#1dd1a1'],
		animationType: 'wave',
		order: 7,
	},
	{
		id: 'candle',
		name: 'Candle',
		colors: ['#ff9f43', '#ee5a24', '#ffeaa7'],
		animationType: 'candle',
		order: 8,
	},
	{
		id: 'police',
		name: 'Police',
		colors: ['#e74c3c', '#3498db'],
		animationType: 'police',
		order: 9,
	},
	{
		id: 'warning',
		name: 'Warning',
		colors: ['#f39c12', '#e67e22'],
		animationType: 'warning',
		order: 10,
	},
	{
		id: 'disco',
		name: 'Disco',
		colors: ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#f1c40f', '#e67e22'],
		animationType: 'disco',
		order: 11,
	},
	{
		id: 'sunrise',
		name: 'Sunrise',
		colors: ['#1a1a2e', '#16213e', '#e94560', '#ff6b6b', '#feca57', '#fffacd'],
		animationType: 'sunrise',
		order: 12,
	},
	{
		id: 'sunset',
		name: 'Sunset',
		colors: ['#ff6b6b', '#feca57', '#ff9ff3', '#a29bfe', '#341f97', '#1a1a2e'],
		animationType: 'sunset',
		order: 13,
	},
	{
		id: 'forest',
		name: 'Forest',
		colors: ['#27ae60', '#2ecc71', '#1abc9c', '#16a085'],
		animationType: 'pulse',
		order: 14,
	},
	{
		id: 'rave',
		name: 'Rave',
		colors: [
			'#ff0000',
			'#ff00ff',
			'#00ffff',
			'#00ff00',
			'#ffff00',
			'#ff6600',
			'#0066ff',
			'#ff0066',
		],
		animationType: 'rave',
		order: 15,
	},
	{
		id: 'scanner',
		name: 'Scanner',
		colors: ['#e74c3c'],
		animationType: 'scanner',
		order: 16,
	},
	{
		id: 'matrix',
		name: 'Matrix',
		colors: ['#00ff00'],
		animationType: 'matrix',
		order: 17,
	},
	{
		id: 'lavender',
		name: 'Lavender',
		colors: ['#e6e6fa', '#dda0dd', '#da70d6', '#ba55d3'],
		animationType: 'pulse',
		order: 18,
	},
	{
		id: 'cherry-blossom',
		name: 'Cherry Blossom',
		colors: ['#ffb7c5', '#ff69b4', '#ff1493', '#db7093'],
		animationType: 'wave',
		order: 19,
	},
	{
		id: 'autumn',
		name: 'Autumn',
		colors: ['#d35400', '#e67e22', '#f39c12', '#c0392b'],
		animationType: 'gradient',
		order: 20,
	},
	{
		id: 'ice',
		name: 'Ice',
		colors: ['#74b9ff', '#0984e3', '#81ecec', '#00cec9'],
		animationType: 'wave',
		order: 21,
	},
	{
		id: 'romance',
		name: 'Romance',
		colors: ['#fd79a8', '#e84393', '#d63031', '#ff7675'],
		animationType: 'pulse',
		order: 22,
	},
	{
		id: 'midnight',
		name: 'Midnight',
		colors: ['#0c0c0c', '#1a1a2e', '#16213e', '#0f3460'],
		animationType: 'breath',
		order: 23,
	},
];

/** Get mood by ID. */
export function getDefaultMoodById(id: string): Mood | undefined {
	return DEFAULT_MOODS.find((m) => m.id === id);
}

/** Get gradient CSS for a mood. */
export function getMoodGradient(mood: Mood): string {
	if (mood.colors.length === 1) {
		return mood.colors[0];
	}
	return `linear-gradient(135deg, ${mood.colors.join(', ')})`;
}
