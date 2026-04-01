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

/**
 * Haversine formula — distance between two lat/lng points in meters.
 */
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance in meters to human-readable string.
 */
export function formatDistance(meters: number): string {
	if (meters < 1000) return `${meters} m`;
	return `${(meters / 1000).toFixed(1)} km`;
}
