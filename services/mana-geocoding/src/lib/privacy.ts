/**
 * Privacy helpers for outbound public-API requests.
 *
 * The provider chain quantizes coordinates before forwarding to public
 * geocoding endpoints (Photon, Nominatim) so the user's precise position
 * doesn't end up in a third party's logs.
 *
 * Quantization rules:
 *   - **Forward search focus** (`focus.lat/lon`): 2 decimals ≈ 1.1 km
 *     resolution. Enough to bias results "near you" without revealing
 *     home/workplace addresses.
 *   - **Reverse-geocoding coords** (`lat/lon`): 3 decimals ≈ 110 m
 *     resolution. Trades a small amount of accuracy for the privacy of
 *     not telling Photon "user is at THIS HOUSE". Reverse geocoding
 *     against the city block instead of the building is acceptable.
 *
 * Pelias and other LAN-local providers always get the original
 * full-precision coordinates — quantization only applies on the way
 * out to the public internet.
 */

/** ~1.1 km resolution. Enough for "results near me" biasing. */
export const PUBLIC_FOCUS_DECIMALS = 2;

/** ~110 m resolution. Identifies city block, not building. */
export const PUBLIC_REVERSE_DECIMALS = 3;

/**
 * Round a coordinate to `decimals` decimal places. Accepts string or
 * number to make the call sites clean (the wrapper passes strings
 * straight from query params; tests use numbers).
 *
 * Returns a string so the caller can drop it directly into
 * URLSearchParams without re-stringification (which would otherwise
 * undo the quantization at toString-time).
 */
export function quantizeCoord(
	value: string | number | undefined,
	decimals: number
): string | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const n = typeof value === 'string' ? parseFloat(value) : value;
	if (!Number.isFinite(n)) return undefined;
	return n.toFixed(decimals);
}
