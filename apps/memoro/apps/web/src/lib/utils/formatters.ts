import { format, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Format duration from seconds to human-readable string with units
 *
 * Examples:
 * - 45 seconds → "45 Sekunden"
 * - 90 seconds → "1:30 Minuten"
 * - 3665 seconds → "1:01:05 Stunden"
 */
export function formatDuration(durationSeconds: number): string {
	if (!durationSeconds || durationSeconds === 0) return '0 Sekunden';

	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);
	const seconds = Math.floor(durationSeconds % 60);

	// Hours present
	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Stunden`;
	}

	// Only minutes and seconds
	if (minutes > 0) {
		return `${minutes}:${seconds.toString().padStart(2, '0')} Minuten`;
	}

	// Only seconds
	return `${seconds} Sekunden`;
}

/**
 * Extract duration in seconds from a memo object
 */
export function getMemooDuration(memo: any): number {
	return memo.source?.duration_seconds || memo.source?.duration || 0;
}

/**
 * Format timestamp to localized German format
 *
 * Examples:
 * - Today → "Heute, 14:30"
 * - Yesterday → "Gestern, 14:30"
 * - Other → "15. März 2024, 14:30"
 */
export function formatTimestamp(date: Date | string): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;

	if (isToday(dateObj)) {
		return `Heute, ${format(dateObj, 'HH:mm')}`;
	}

	if (isYesterday(dateObj)) {
		return `Gestern, ${format(dateObj, 'HH:mm')}`;
	}

	return format(dateObj, 'd. MMMM yyyy, HH:mm', { locale: de });
}
