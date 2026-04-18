/**
 * Feedback loop — aggregate save/dismiss ratios per category and source
 * to build an implicit user profile for better relevance scoring.
 *
 * The profile is computed on-demand from discovery_user_actions joined
 * with discovered_events. No separate table needed — the action history
 * IS the profile.
 */

import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { discoveryUserActions, discoveredEvents } from '../db/schema/discovery';

/** Per-category affinity based on save/dismiss ratio. */
export interface CategoryAffinity {
	category: string;
	saves: number;
	dismisses: number;
	/** 0.0–2.0 multiplier: >1 means user likes this category, <1 means dislikes. */
	weight: number;
}

/** Per-source quality based on save/dismiss ratio. */
export interface SourceQuality {
	sourceId: string;
	sourceName: string | null;
	saves: number;
	dismisses: number;
	/** 0.0–2.0 multiplier. Sources with high dismiss rate get penalized. */
	weight: number;
}

export interface UserProfile {
	categoryAffinities: CategoryAffinity[];
	sourceQualities: SourceQuality[];
	totalActions: number;
}

/**
 * Compute an implicit user profile from their save/dismiss history.
 * Returns category affinities and source quality metrics.
 *
 * Requires at least 5 actions to be meaningful — returns empty profile
 * if insufficient data.
 */
export async function computeUserProfile(db: Database, userId: string): Promise<UserProfile> {
	// Count total actions to check if we have enough data
	const countResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(discoveryUserActions)
		.where(eq(discoveryUserActions.userId, userId));

	const totalActions = countResult[0]?.count ?? 0;
	if (totalActions < 5) {
		return { categoryAffinities: [], sourceQualities: [], totalActions };
	}

	// Category affinities: group by category, count saves/dismisses
	const categoryRows = await db.execute(sql`
		SELECT
			de.category,
			COUNT(*) FILTER (WHERE dua.action = 'save') AS saves,
			COUNT(*) FILTER (WHERE dua.action = 'dismiss') AS dismisses
		FROM event_discovery.discovery_user_actions dua
		JOIN event_discovery.discovered_events de ON de.id = dua.event_id
		WHERE dua.user_id = ${userId} AND de.category IS NOT NULL
		GROUP BY de.category
		ORDER BY saves DESC
	`);

	const categoryAffinities: CategoryAffinity[] = (
		categoryRows as unknown as Array<{
			category: string;
			saves: string;
			dismisses: string;
		}>
	).map((row) => {
		const saves = parseInt(row.saves, 10);
		const dismisses = parseInt(row.dismisses, 10);
		const total = saves + dismisses;
		// Weight: ratio of saves to total, scaled to 0–2 range
		// 100% saves → 2.0, 50% → 1.0, 0% → 0.2 (floor)
		const ratio = total > 0 ? saves / total : 0.5;
		return {
			category: row.category,
			saves,
			dismisses,
			weight: Math.max(0.2, ratio * 2),
		};
	});

	// Source quality: group by source, count saves/dismisses
	const sourceRows = await db.execute(sql`
		SELECT
			de.source_id,
			de.source_name,
			COUNT(*) FILTER (WHERE dua.action = 'save') AS saves,
			COUNT(*) FILTER (WHERE dua.action = 'dismiss') AS dismisses
		FROM event_discovery.discovery_user_actions dua
		JOIN event_discovery.discovered_events de ON de.id = dua.event_id
		WHERE dua.user_id = ${userId}
		GROUP BY de.source_id, de.source_name
		ORDER BY saves DESC
	`);

	const sourceQualities: SourceQuality[] = (
		sourceRows as unknown as Array<{
			source_id: string;
			source_name: string | null;
			saves: string;
			dismisses: string;
		}>
	).map((row) => {
		const saves = parseInt(row.saves, 10);
		const dismisses = parseInt(row.dismisses, 10);
		const total = saves + dismisses;
		const ratio = total > 0 ? saves / total : 0.5;
		return {
			sourceId: row.source_id,
			sourceName: row.source_name,
			saves,
			dismisses,
			weight: Math.max(0.2, ratio * 2),
		};
	});

	return { categoryAffinities, sourceQualities, totalActions };
}
