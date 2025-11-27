/**
 * Memoro Formatters
 * Re-exports shared utilities and adds Memoro-specific helpers
 */

// Re-export date/time utilities from shared package
export {
	formatTimestamp,
	formatShortDate,
	formatRelativeTime,
	isToday,
	isYesterday,
	type LocaleKey,
} from '@manacore/shared-utils';

// Re-export format utilities from shared package (with explicit names for clarity)
export {
	formatDuration as formatDurationCompact,
	parseDuration,
	formatDurationWithUnits,
	formatDurationHumanReadable,
} from '@manacore/shared-utils';

/**
 * Format duration from seconds to human-readable string with German units
 *
 * This is the Memoro-specific format that displays:
 * - "45 Sekunden" for seconds only
 * - "1:30 Minuten" for minutes and seconds
 * - "1:01:05 Stunden" for hours, minutes, and seconds
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
