/**
 * Formatting utility functions
 */

/**
 * Format duration from seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '--:--';
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration from milliseconds
 */
export function formatDurationFromMs(milliseconds: number): string {
	return formatDuration(milliseconds / 1000);
}

/**
 * Format duration with units (e.g., "2 min 30 sec" or "1h 23m")
 */
export function formatDurationWithUnits(seconds: number, locale: 'en' | 'de' = 'en'): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return locale === 'de' ? 'keine Zeit' : 'no time';
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}

	if (minutes > 0) {
		return remainingSeconds > 0 && minutes < 5 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	}

	return `${remainingSeconds}s`;
}

/**
 * Format duration to human readable text
 */
export function formatDurationHumanReadable(seconds: number, locale: 'en' | 'de' = 'de'): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return locale === 'de' ? 'keine Zeit' : 'no time';
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	const parts: string[] = [];

	if (locale === 'de') {
		if (hours > 0) {
			parts.push(`${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`);
		}
		if (minutes > 0) {
			parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`);
		}
		if (remainingSeconds > 0 && hours === 0) {
			parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'Sekunde' : 'Sekunden'}`);
		}
		return parts.length === 0 ? '0 Sekunden' : parts.join(' ');
	} else {
		if (hours > 0) {
			parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
		}
		if (minutes > 0) {
			parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
		}
		if (remainingSeconds > 0 && hours === 0) {
			parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
		}
		return parts.length === 0 ? '0 seconds' : parts.join(' ');
	}
}

/**
 * Format file size from bytes to human readable string
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
	if (bytes === 0) return '0 B';
	if (!Number.isFinite(bytes) || bytes < 0) return '--';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, locale: string = 'de-DE'): string {
	return num.toLocaleString(locale);
}

/**
 * Format currency
 */
export function formatCurrency(
	amount: number,
	currency: string = 'EUR',
	locale: string = 'de-DE'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	}).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(
	value: number,
	decimals: number = 0,
	locale: string = 'de-DE'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
}

/**
 * Format duration as compact string (alias for formatDuration)
 * Kept for compatibility - returns MM:SS or HH:MM:SS
 */
export const formatDurationCompact = formatDuration;

/**
 * Parse duration string to seconds
 *
 * @param duration - Duration string (e.g., "1:30" or "1:01:05")
 * @returns Duration in seconds
 */
export function parseDuration(duration: string): number {
	const parts = duration.split(':').map(Number);

	if (parts.length === 3) {
		// Hours:Minutes:Seconds
		return parts[0] * 3600 + parts[1] * 60 + parts[2];
	} else if (parts.length === 2) {
		// Minutes:Seconds
		return parts[0] * 60 + parts[1];
	}

	return parts[0] || 0;
}
