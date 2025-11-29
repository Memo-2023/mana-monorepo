/**
 * Time of Day Theme Definitions
 * Provides color schemes, messages, and visual themes for different times of day
 */

import { TimeOfDay } from '../utils/timeOfDay';

export interface TimeOfDayTheme {
	// Visual theme
	gradientColors: string[];
	textColor: string;
	particleColors: string[];

	// Messages
	title: string;
	subtitle: string;
	emoji: string;

	// Particle configuration
	particleType: 'birds' | 'clouds' | 'lanterns' | 'stars';
	particleCount: number;
}

export const timeOfDayThemes: Record<TimeOfDay, TimeOfDayTheme> = {
	morning: {
		gradientColors: ['#FFB88C', '#FFA07A', '#87CEEB'],
		textColor: '#FFFFFF',
		particleColors: ['#FFE4B5', '#FFDAB9'],
		title: 'Einen schönen Morgen dir',
		subtitle: 'Die Vögel begrüßen den neuen Tag',
		emoji: '🌅',
		particleType: 'birds',
		particleCount: 8,
	},

	day: {
		gradientColors: ['#87CEEB', '#98D8E8', '#FFE66D'],
		textColor: '#FFFFFF',
		particleColors: ['#FFFFFF', '#F0F8FF'],
		title: 'Einen schönen Tag dir',
		subtitle: '',
		emoji: '☁️',
		particleType: 'clouds',
		particleCount: 6,
	},

	evening: {
		gradientColors: ['#FF6B6B', '#FFA07A', '#9B59B6'],
		textColor: '#FFFFFF',
		particleColors: ['#FFD700', '#FFA500'],
		title: 'Einen schönen Abend dir',
		subtitle: 'Die Laternen beginnen zu leuchten',
		emoji: '🌆',
		particleType: 'lanterns',
		particleCount: 10,
	},

	night: {
		gradientColors: ['#2C3E50', '#34495E', '#1A1A2E'],
		textColor: '#FFFFFF',
		particleColors: ['#FFFFFF', '#FFD700', '#F0E68C'],
		title: 'Eine gute Nacht dir',
		subtitle: 'Die Sterne funkeln am Himmel',
		emoji: '🌙',
		particleType: 'stars',
		particleCount: 18,
	},
};

/**
 * Get the theme for a specific time of day
 * @param timeOfDay The time period
 * @returns The complete theme object
 */
export function getTimeOfDayTheme(timeOfDay: TimeOfDay): TimeOfDayTheme {
	return timeOfDayThemes[timeOfDay];
}
