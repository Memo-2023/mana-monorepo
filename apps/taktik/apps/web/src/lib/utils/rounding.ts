/**
 * Duration rounding utility
 *
 * Applies rounding based on user settings (increment + method).
 */

import type { RoundingMethod } from '@taktik/shared';

/**
 * Round a duration in seconds based on settings.
 * @param seconds - Duration in seconds
 * @param increment - Rounding increment in minutes (0 = no rounding)
 * @param method - Rounding method: 'none' | 'up' | 'down' | 'nearest'
 * @returns Rounded duration in seconds
 */
export function roundDuration(seconds: number, increment: number, method: RoundingMethod): number {
	if (increment <= 0 || method === 'none') return seconds;

	const incrementSeconds = increment * 60;
	const remainder = seconds % incrementSeconds;

	if (remainder === 0) return seconds;

	switch (method) {
		case 'up':
			return seconds - remainder + incrementSeconds;
		case 'down':
			return seconds - remainder;
		case 'nearest':
			return remainder >= incrementSeconds / 2
				? seconds - remainder + incrementSeconds
				: seconds - remainder;
		default:
			return seconds;
	}
}
