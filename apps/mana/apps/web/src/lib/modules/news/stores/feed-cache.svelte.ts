/**
 * Feed-cache store — pulls the curated pool from /api/v1/news/feed
 * into the local-only `newsCachedFeed` table.
 *
 * Why a local mirror at all? The feed engine (scoreArticle, rankFeed)
 * runs against the cached pool every time the feed view re-renders.
 * Hitting the network on every render would be silly; hitting the
 * network on every preferences change would be worse. Caching also
 * gives us offline reading for the cards the user already saw.
 *
 * The cache is bounded: we keep at most CACHE_LIMIT rows, and prune
 * the oldest by ingestedAt before each refresh. The bounded size + the
 * fact that the cache is plaintext + not synced is what justifies
 * leaving it out of the encryption registry and the sync map.
 *
 * `start()` should be called once from the news +layout — it kicks an
 * immediate refresh and then polls on a 10-minute interval. The
 * interval is held in module scope on purpose so multiple route entries
 * can't accidentally double up.
 */

import { cachedFeedTable } from '../collections';
import { fetchFeed } from '../api';
import type { FeedArticleDto } from '../api';
import type { LocalCachedArticle } from '../types';

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_LIMIT = 400;

let pollHandle: ReturnType<typeof setInterval> | null = null;
let inFlight = false;
let lastError: string | null = null;
let lastRefreshedAt: string | null = null;

function toLocal(dto: FeedArticleDto): LocalCachedArticle {
	return {
		id: dto.id,
		originalUrl: dto.originalUrl,
		title: dto.title,
		excerpt: dto.excerpt,
		content: dto.content,
		htmlContent: dto.htmlContent,
		author: dto.author,
		siteName: dto.siteName,
		sourceSlug: dto.sourceSlug,
		imageUrl: dto.imageUrl,
		topic: dto.topic,
		language: dto.language,
		wordCount: dto.wordCount,
		readingTimeMinutes: dto.readingTimeMinutes,
		publishedAt: dto.publishedAt,
		ingestedAt: dto.ingestedAt,
		cachedAt: new Date().toISOString(),
	};
}

async function pruneToLimit(): Promise<void> {
	const count = await cachedFeedTable.count();
	if (count <= CACHE_LIMIT) return;
	// Keep the newest CACHE_LIMIT rows by ingestedAt. Dexie has no
	// LIMIT/OFFSET on plain table, so collect all PKs sorted and slice.
	const all = await cachedFeedTable.toArray();
	all.sort((a, b) => (b.ingestedAt ?? '').localeCompare(a.ingestedAt ?? ''));
	const toDelete = all.slice(CACHE_LIMIT).map((a) => a.id);
	if (toDelete.length > 0) await cachedFeedTable.bulkDelete(toDelete);
}

export const feedCacheStore = {
	get lastError() {
		return lastError;
	},
	get lastRefreshedAt() {
		return lastRefreshedAt;
	},
	get inFlight() {
		return inFlight;
	},

	async refresh(opts: { topics?: string[]; lang?: 'de' | 'en' | 'all' } = {}): Promise<void> {
		if (inFlight) return;
		inFlight = true;
		lastError = null;
		try {
			const dtos = await fetchFeed({
				limit: 200,
				topics: opts.topics,
				lang: opts.lang ?? 'all',
			});
			if (dtos.length > 0) {
				// bulkPut keeps existing rows for the same id and updates
				// them in place. New rows from the server replace the
				// previous mirror, old rows that fell out of the server's
				// 200-row window stay in the cache until pruneToLimit cuts
				// them. That's the behavior we want — the cache should
				// degrade gradually, not flush every refresh.
				await cachedFeedTable.bulkPut(dtos.map(toLocal));
			}
			await pruneToLimit();
			lastRefreshedAt = new Date().toISOString();
		} catch (err) {
			lastError = err instanceof Error ? err.message : String(err);
			console.warn('[news] feed refresh failed:', lastError);
		} finally {
			inFlight = false;
		}
	},

	start(opts: { topics?: string[]; lang?: 'de' | 'en' | 'all' } = {}): void {
		if (pollHandle) return; // already started
		void this.refresh(opts);
		pollHandle = setInterval(() => void this.refresh(opts), POLL_INTERVAL_MS);
	},

	stop(): void {
		if (pollHandle) {
			clearInterval(pollHandle);
			pollHandle = null;
		}
	},
};
