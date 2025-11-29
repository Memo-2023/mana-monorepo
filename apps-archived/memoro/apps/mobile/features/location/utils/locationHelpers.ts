/**
 * Helper functions for working with location data
 */

/**
 * Parse PostGIS POINT string to coordinates
 * @param pointString - PostGIS POINT format: "POINT(longitude latitude)"
 * @returns Object with latitude and longitude or null if invalid
 */
export function parsePostGISPoint(
	pointString: string | null | undefined
): { latitude: number; longitude: number } | null {
	if (!pointString) return null;

	// Match POINT(longitude latitude) format
	const match = pointString.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
	if (!match) return null;

	const longitude = parseFloat(match[1]);
	const latitude = parseFloat(match[2]);

	// Validate coordinates
	if (isNaN(longitude) || isNaN(latitude)) return null;
	if (latitude < -90 || latitude > 90) return null;
	if (longitude < -180 || longitude > 180) return null;

	return { latitude, longitude };
}

/**
 * Convert coordinates to PostGIS POINT format
 * @param latitude
 * @param longitude
 * @returns PostGIS POINT string
 */
export function toPostGISPoint(latitude: number, longitude: number): string {
	return `POINT(${longitude} ${latitude})`;
}

/**
 * Get location data from memo using the PostGIS location field and address from metadata
 * @param memo - The memo object
 * @returns Location data with latitude, longitude, and address or null
 */
export function getMemoLocation(
	memo: any
): { latitude?: number; longitude?: number; address?: any } | null {
	// Check if we have address data in metadata
	const hasAddress = memo?.metadata?.address;

	// Parse location coordinates if available
	const parsed = memo?.location ? parsePostGISPoint(memo.location) : null;

	// If we have neither coordinates nor address, return null
	if (!parsed && !hasAddress) {
		return null;
	}

	// Build result with available data
	const result: { latitude?: number; longitude?: number; address?: any } = {};

	if (parsed) {
		result.latitude = parsed.latitude;
		result.longitude = parsed.longitude;
	}

	if (hasAddress) {
		result.address = memo.metadata.address;
	}

	return result;
}
