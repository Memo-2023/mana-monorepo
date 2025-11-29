/**
 * Time of Day utility functions
 * Provides functionality to determine the current time period and associated themes
 */

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

/**
 * Get the current time of day based on the hour
 * @param mockHour Optional hour for testing (0-23)
 * @returns The current time period
 */
export function getTimeOfDay(mockHour?: number): TimeOfDay {
	const now = new Date();
	const hour = mockHour !== undefined ? mockHour : now.getHours();

	if (hour >= 6 && hour < 11) {
		return 'morning';
	} else if (hour >= 11 && hour < 17) {
		return 'day';
	} else if (hour >= 17 && hour < 21) {
		return 'evening';
	} else {
		return 'night';
	}
}

/**
 * Get a greeting message based on the time of day
 * @param timeOfDay The time period
 * @returns A greeting string
 */
export function getGreeting(timeOfDay: TimeOfDay): string {
	const greetings = {
		morning: 'Guten Morgen',
		day: 'Hallo',
		evening: 'Guten Abend',
		night: 'Gute Nacht',
	};
	return greetings[timeOfDay];
}

/**
 * Get emoji associated with time of day
 * @param timeOfDay The time period
 * @returns An emoji string
 */
export function getTimeEmoji(timeOfDay: TimeOfDay): string {
	const emojis = {
		morning: '🌅',
		day: '☁️',
		evening: '🌆',
		night: '🌙',
	};
	return emojis[timeOfDay];
}
