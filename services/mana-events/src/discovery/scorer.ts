/**
 * Relevance Scorer — ranks discovered events for the user's feed.
 *
 * Scoring dimensions:
 *   - Category match with user interests (+20 per match, weighted)
 *   - Freetext match in title (+15 per interest freetext match)
 *   - Distance to nearest region center (-1 per km beyond 5km)
 *   - Time proximity (+10 if within 7 days, +5 if within 14 days)
 *   - Weekend bonus (+5 for Sat/Sun events)
 *
 * Score range: 0–100, clamped.
 */

export interface ScoredEventInput {
	category: string | null;
	title: string;
	lat: number | null;
	lon: number | null;
	startAt: Date;
}

export interface ScoringContext {
	interests: Array<{ category: string; freetext: string | null; weight: number }>;
	regions: Array<{ lat: number; lon: number; radiusKm: number }>;
}

/**
 * Compute a relevance score for a discovered event.
 * Returns 0–100, higher = more relevant.
 */
export function scoreEvent(event: ScoredEventInput, ctx: ScoringContext): number {
	let score = 50; // Base score

	// ── Category match ──────────────────────────────────────────
	for (const interest of ctx.interests) {
		if (event.category && event.category === interest.category) {
			score += 20 * interest.weight;
		}
		if (interest.freetext && event.title.toLowerCase().includes(interest.freetext.toLowerCase())) {
			score += 15 * interest.weight;
		}
	}

	// ── Distance ────────────────────────────────────────────────
	if (event.lat != null && event.lon != null && ctx.regions.length > 0) {
		const nearest = Math.min(
			...ctx.regions.map((r) => haversineKm(event.lat!, event.lon!, r.lat, r.lon))
		);
		// Penalty: -1 per km beyond 5km
		score -= Math.max(0, nearest - 5);
	}

	// ── Time proximity ──────────────────────────────────────────
	const daysUntil = (event.startAt.getTime() - Date.now()) / 86_400_000;
	if (daysUntil >= 0 && daysUntil <= 7) score += 10;
	else if (daysUntil > 7 && daysUntil <= 14) score += 5;

	// ── Weekend bonus ───────────────────────────────────────────
	const dow = event.startAt.getDay();
	if (dow === 0 || dow === 6) score += 5;

	return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Haversine distance in km between two lat/lon points.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}
