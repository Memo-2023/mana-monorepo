/**
 * Date formatting utilities for consistent date/time display
 */

/**
 * Formats a date string for simple display
 * @param dateString - ISO date string
 * @returns Localized date string
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString();
}

/**
 * Formats a date/time for audio player display with localization
 * Includes weekday, date, time, and optional duration
 *
 * @param dateString - ISO date string
 * @param durationSeconds - Optional duration in seconds
 * @param language - Language code for localization (e.g., 'en', 'de-DE')
 * @returns Formatted date/time string with weekday and duration
 */
export function formatDateTimeForAudio(
	dateString: string,
	durationSeconds?: number,
	language: string
): string {
	const date = new Date(dateString);

	// Get localized weekday name
	const weekday = date.toLocaleDateString(language, { weekday: 'long' });
	const formattedDate = date.toLocaleDateString(language);

	// Use language-aware time formatting
	const langCode = language.split('-')[0];
	const is12Hour = ['en', 'hi', 'ur', 'tl', 'ms'].includes(langCode);
	const formattedTime = date.toLocaleTimeString(language, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: is12Hour,
	});

	// Apply language-specific time formatting
	let timeWithDuration = formattedTime;
	if (langCode === 'de') timeWithDuration = `${formattedTime} Uhr`;
	else if (langCode === 'nl') timeWithDuration = `${formattedTime} uur`;
	else if (langCode === 'da') timeWithDuration = `kl. ${formattedTime.replace(':', '.')}`;
	else if (langCode === 'sv' || langCode === 'nb') timeWithDuration = `kl. ${formattedTime}`;
	else if (langCode === 'it') timeWithDuration = `alle ${formattedTime}`;
	else if (langCode === 'es') timeWithDuration = `a las ${formattedTime}`;
	else if (langCode === 'pt') timeWithDuration = `às ${formattedTime}`;
	else if (langCode === 'fr') timeWithDuration = `à ${formattedTime.replace(':', 'h')}`;
	else if (langCode === 'hi' || langCode === 'ur') timeWithDuration = formattedTime;
	else if (langCode === 'ja') timeWithDuration = formattedTime;

	// Add duration if available
	if (durationSeconds && durationSeconds > 0) {
		const minutes = Math.floor(durationSeconds / 60);
		const seconds = Math.floor(durationSeconds % 60);
		const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		timeWithDuration += ` • ${durationStr}`;
	}

	return `${weekday}, ${formattedDate} ${timeWithDuration}`;
}

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 23min" or "45min")
 */
export function formatDuration(seconds: number): string {
	if (!seconds || seconds <= 0) return '';

	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours > 0) {
		return `${hours}h ${remainingMinutes}min`;
	}
	return `${minutes}min`;
}

/**
 * Formats a date to show relative time (e.g., "2 hours ago", "yesterday")
 * @param dateString - ISO date string
 * @param language - Language code for localization
 * @param now - Optional current date for testing
 * @returns Relative time string
 */
export function formatRelativeTime(
	dateString: string,
	language: string,
	now: Date = new Date()
): string {
	const date = new Date(dateString);
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	// For very recent times, show exact time
	if (diffMinutes < 1) {
		return 'Just now';
	}

	// Use Intl.RelativeTimeFormat if available
	if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
		const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

		if (diffDays > 0 && diffDays < 7) {
			return rtf.format(-diffDays, 'day');
		} else if (diffHours > 0 && diffHours < 24) {
			return rtf.format(-diffHours, 'hour');
		} else if (diffMinutes > 0 && diffMinutes < 60) {
			return rtf.format(-diffMinutes, 'minute');
		}
	}

	// Fallback for older browsers or if more than a week
	if (diffDays > 7) {
		return formatDate(dateString);
	} else if (diffDays > 0) {
		return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
	} else if (diffHours > 0) {
		return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
	} else {
		return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
	}
}
