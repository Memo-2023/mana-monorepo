/**
 * Pure feed-engine: takes the raw cached pool + the user's preferences
 * and reactions, returns a sorted, filtered list of articles to show.
 *
 * No state, no I/O — every input is passed in. The store layer wires
 * this up against live Dexie data via $derived.
 *
 * Scoring formula (deterministic, no ML):
 *   score = recency × topicWeight × sourceWeight
 *
 *   recency       1.0 for <1h old, decays linearly to 0 over 7 days
 *   topicWeight   default 1.0, +0.1 per "interested" reaction in that
 *                 topic, −0.05 per "not_interested" (clamped 0.1..3.0)
 *   sourceWeight  same dynamics keyed on source slug
 *
 * Hard filters (applied before scoring):
 *   - article topic must be in preferences.selectedTopics
 *   - article source must NOT be in preferences.blockedSources
 *   - language must be in preferences.preferredLanguages
 *   - article must not have a prior reaction
 *     (interested → moved to reading list, not_interested/hidden →
 *      explicitly suppressed)
 */

import type { LocalCachedArticle, Preferences, Reaction, ReactionKind } from './types';

export const TOPIC_WEIGHT_DEFAULT = 1.0;
export const TOPIC_WEIGHT_MIN = 0.1;
export const TOPIC_WEIGHT_MAX = 3.0;

export const INTERESTED_DELTA = 0.1;
export const NOT_INTERESTED_DELTA = -0.05;

const RECENCY_WINDOW_HOURS = 168; // 7 days

function recencyScore(publishedAt: string | null): number {
	if (!publishedAt) return 0.1;
	const ageH = (Date.now() - new Date(publishedAt).getTime()) / 3.6e6;
	if (ageH < 0) return 1.0;
	return Math.max(0, 1 - ageH / RECENCY_WINDOW_HOURS);
}

export interface ScoreContext {
	prefs: Preferences;
	/** Set of curatedArticleIds that already have any reaction. */
	reactedIds: ReadonlySet<string>;
}

/** Build the lookup set once and reuse across all scoreArticle calls. */
export function buildReactedIds(reactions: readonly Reaction[]): Set<string> {
	const set = new Set<string>();
	for (const r of reactions) set.add(r.articleId);
	return set;
}

/**
 * Returns a number ≥ 0 if the article passes filters, or `null` if it
 * should be hidden entirely. Callers sort by descending score.
 */
export function scoreArticle(article: LocalCachedArticle, ctx: ScoreContext): number | null {
	const { prefs, reactedIds } = ctx;

	if (prefs.selectedTopics.length > 0 && !prefs.selectedTopics.includes(article.topic as never)) {
		return null;
	}
	if (prefs.blockedSources.includes(article.sourceSlug)) return null;
	if (
		prefs.preferredLanguages.length > 0 &&
		!prefs.preferredLanguages.includes(article.language as never)
	) {
		return null;
	}
	if (reactedIds.has(article.id)) return null;

	const topicW = prefs.topicWeights[article.topic] ?? TOPIC_WEIGHT_DEFAULT;
	const sourceW = prefs.sourceWeights[article.sourceSlug] ?? TOPIC_WEIGHT_DEFAULT;
	const recency = recencyScore(article.publishedAt);

	// Floor recency at 0.05 so very old but highly-weighted sources still
	// surface above brand-new but unweighted ones — keeps the feed from
	// devolving into a pure recency stream.
	const floored = Math.max(recency, 0.05);
	return floored * topicW * sourceW;
}

export interface ScoredArticle {
	article: LocalCachedArticle;
	score: number;
}

/**
 * Score the whole pool, drop the rejected ones, and return descending
 * by score. Stable: ties broken by `publishedAt` desc.
 */
export function rankFeed(pool: readonly LocalCachedArticle[], ctx: ScoreContext): ScoredArticle[] {
	const out: ScoredArticle[] = [];
	for (const article of pool) {
		const score = scoreArticle(article, ctx);
		if (score == null) continue;
		out.push({ article, score });
	}
	out.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score;
		const ap = a.article.publishedAt ?? '';
		const bp = b.article.publishedAt ?? '';
		return bp.localeCompare(ap);
	});
	return out;
}

// ─── Weight updates (returned as a partial Preferences diff) ───

export interface WeightDiff {
	topicWeights?: Record<string, number>;
	sourceWeights?: Record<string, number>;
	blockedSources?: string[];
}

function clamp(n: number): number {
	return Math.max(TOPIC_WEIGHT_MIN, Math.min(TOPIC_WEIGHT_MAX, n));
}

/**
 * Compute the preferences delta for a new reaction. The store layer
 * merges this back onto the existing preferences row in a single
 * `update()` call.
 */
export function applyReaction(
	prefs: Preferences,
	reaction: ReactionKind,
	topic: string,
	sourceSlug: string
): WeightDiff {
	if (reaction === 'source_blocked') {
		if (prefs.blockedSources.includes(sourceSlug)) return {};
		return { blockedSources: [...prefs.blockedSources, sourceSlug] };
	}

	if (reaction === 'hidden') {
		// "Hidden" is a per-article suppression — no weight change. The
		// reaction row alone is enough for `reactedIds` to filter it.
		return {};
	}

	const delta = reaction === 'interested' ? INTERESTED_DELTA : NOT_INTERESTED_DELTA;

	const currentTopic = prefs.topicWeights[topic] ?? TOPIC_WEIGHT_DEFAULT;
	const currentSource = prefs.sourceWeights[sourceSlug] ?? TOPIC_WEIGHT_DEFAULT;

	return {
		topicWeights: { ...prefs.topicWeights, [topic]: clamp(currentTopic + delta) },
		sourceWeights: {
			...prefs.sourceWeights,
			[sourceSlug]: clamp(currentSource + delta),
		},
	};
}
