/**
 * News Research module — feed discovery, validation, and topic-scoped
 * article search over user-selected feeds. Stateless: every request is a
 * fresh fetch. Consumers are the /news-research UI and the `research_news`
 * LLM tool.
 */

import { Hono } from 'hono';
import {
	discoverFeeds,
	validateFeed,
	parseFeedUrl,
	extractFromUrl,
	type NormalizedFeedItem,
} from '@mana/shared-rss';
import { webSearch } from '../../lib/search';

const routes = new Hono();

const MAX_FEEDS_PER_SEARCH = 12;
const MAX_ARTICLES_PER_FEED = 40;

// ─── POST /discover ─────────────────────────────────────────
// Input shapes: { siteUrl } or { query } (with optional language).
// Returns a list of discovered feeds. For query mode we run a web
// search and then attempt feed discovery on each top result.

routes.post('/discover', async (c) => {
	const body = await c.req.json<{
		siteUrl?: string;
		query?: string;
		language?: string;
		limit?: number;
	}>();

	const limit = Math.min(body.limit ?? 10, 20);

	if (body.siteUrl) {
		const feeds = await discoverFeeds(body.siteUrl);
		return c.json({ feeds });
	}

	if (body.query) {
		let hits: Awaited<ReturnType<typeof webSearch>>;
		try {
			hits = await webSearch({
				query: `${body.query} rss feed`,
				limit,
				language: body.language,
				categories: ['general', 'news'],
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.warn('[news-research] webSearch failed:', message);
			return c.json(
				{
					error: 'web-search-unavailable',
					message: `Websuche fehlgeschlagen: ${message}. Läuft mana-search (Port 3021)?`,
				},
				502
			);
		}

		const siteUrls = Array.from(new Set(hits.map((h) => h.url).filter(Boolean))).slice(0, limit);

		const perSite = await Promise.all(
			siteUrls.map(async (url) => {
				const feeds = await discoverFeeds(url).catch(() => []);
				return feeds.map((f) => ({ ...f, sourceHit: url }));
			})
		);

		const seen = new Set<string>();
		const feeds = perSite
			.flat()
			.filter((f) => {
				if (seen.has(f.url)) return false;
				seen.add(f.url);
				return true;
			})
			.slice(0, MAX_FEEDS_PER_SEARCH);

		return c.json({ feeds, searched: siteUrls.length });
	}

	return c.json({ error: 'Provide either siteUrl or query' }, 400);
});

// ─── POST /validate ─────────────────────────────────────────

routes.post('/validate', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'url required' }, 400);
	const result = await validateFeed(url);
	return c.json(result);
});

// ─── POST /search ───────────────────────────────────────────
// Fetch selected feeds in parallel, score their items against the
// query, return top N. Scoring is plain keyword frequency for v1;
// BM25/embeddings can replace `scoreItem` later.

interface ScoredArticle extends NormalizedFeedItem {
	feedUrl: string;
	score: number;
}

const STOPWORDS = new Set([
	'der',
	'die',
	'das',
	'und',
	'oder',
	'aber',
	'the',
	'a',
	'an',
	'of',
	'to',
	'in',
	'for',
	'on',
	'with',
]);

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.split(/\s+/)
		.filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreItem(item: NormalizedFeedItem, queryTokens: string[]): number {
	if (queryTokens.length === 0) return 0;
	const haystack = `${item.title} ${item.excerpt ?? ''} ${item.content ?? ''}`.toLowerCase();
	let score = 0;
	for (const q of queryTokens) {
		let from = 0;
		while ((from = haystack.indexOf(q, from)) !== -1) {
			score += 1;
			from += q.length;
		}
	}
	// Title matches count extra.
	const title = item.title.toLowerCase();
	for (const q of queryTokens) {
		if (title.includes(q)) score += 3;
	}
	// Recency boost.
	if (item.publishedAt) {
		const ageDays = (Date.now() - item.publishedAt.getTime()) / 86_400_000;
		if (ageDays < 1) score += 2;
		else if (ageDays < 7) score += 1;
	}
	return score;
}

routes.post('/search', async (c) => {
	const body = await c.req.json<{
		feeds: string[];
		query: string;
		limit?: number;
		sinceIso?: string;
	}>();

	if (!Array.isArray(body.feeds) || body.feeds.length === 0) {
		return c.json({ error: 'feeds[] required' }, 400);
	}
	if (!body.query || typeof body.query !== 'string') {
		return c.json({ error: 'query required' }, 400);
	}

	const queryTokens = tokenize(body.query);
	const limit = Math.min(body.limit ?? 25, 100);
	const since = body.sinceIso ? new Date(body.sinceIso) : null;

	const feeds = body.feeds.slice(0, MAX_FEEDS_PER_SEARCH);

	const perFeed = await Promise.all(
		feeds.map(async (url) => {
			try {
				const items = await parseFeedUrl(url);
				return items.slice(0, MAX_ARTICLES_PER_FEED).map((item) => ({ url, item }));
			} catch {
				return [];
			}
		})
	);

	const scored: ScoredArticle[] = perFeed
		.flat()
		.filter(({ item }) => !since || (item.publishedAt && item.publishedAt >= since))
		.map(({ url, item }) => ({
			...item,
			feedUrl: url,
			score: scoreItem(item, queryTokens),
		}))
		.filter((a) => a.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);

	return c.json({ articles: scored, feedCount: feeds.length });
});

// ─── POST /extract ──────────────────────────────────────────
// Readability for a single URL. Thin wrapper so the news-research
// client doesn't need to hit the legacy /news/extract/save path.

routes.post('/extract', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'url required' }, 400);
	const article = await extractFromUrl(url);
	if (!article) return c.json({ error: 'Extraction failed' }, 502);
	return c.json({ url, ...article });
});

export { routes as newsResearchRoutes };
