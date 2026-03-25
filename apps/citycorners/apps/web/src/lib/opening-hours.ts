const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'] as const;

/**
 * Check if a location is currently open based on its opening hours.
 * Returns null if no opening hours are provided.
 */
export function isOpenNow(openingHours?: Record<string, string> | null): boolean | null {
	if (!openingHours || Object.keys(openingHours).length === 0) return null;

	const now = new Date();
	const dayKey = DAY_KEYS[now.getDay()];
	const hours = openingHours[dayKey];

	if (!hours || hours === 'closed') return false;

	// Parse "HH:MM - HH:MM" format
	const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
	if (!match) return null;

	const [, openH, openM, closeH, closeM] = match;
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const openMinutes = parseInt(openH) * 60 + parseInt(openM);
	const closeMinutes = parseInt(closeH) * 60 + parseInt(closeM);

	// Handle overnight hours (e.g., 22:00 - 03:00)
	if (closeMinutes < openMinutes) {
		return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
	}

	return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
