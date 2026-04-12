/**
 * News module — Reads the curated article pool + extracts ad-hoc URLs.
 *
 * Pool population: handled by the standalone `services/news-ingester`
 * Bun service, which writes into `news.curated_articles` on a 15 min
 * loop. This route file just reads from that table.
 *
 * Saved articles (the user's personal reading list) live entirely in
 * the unified Mana app's local-first IndexedDB and sync via mana-sync;
 * this module never sees them.
 */

import { Hono } from 'hono';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { getConnection } from '../../lib/db';

// ─── DB Connection (reads from news.curated_articles) ──────

const db = drizzle(getConnection());

// ─── Extract Service (Readability fallback for ad-hoc URLs) ─

interface ExtractedArticle {
	title: string;
	content: string;
	htmlContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	wordCount: number;
	readingTimeMinutes: number;
}

async function extractFromUrl(url: string): Promise<ExtractedArticle> {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; ManaNews/1.0; +https://mana.how)',
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch URL: ${response.status}`);
	}

	const html = await response.text();
	const dom = new JSDOM(html, { url });
	const reader = new Readability(dom.window.document);
	const article = reader.parse();

	if (!article) {
		throw new Error('Could not extract article content');
	}

	const wordCount = article.textContent.split(/\s+/).filter(Boolean).length;
	const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

	return {
		title: article.title,
		content: article.textContent,
		htmlContent: article.content,
		excerpt: article.excerpt || article.textContent.slice(0, 200),
		byline: article.byline || null,
		siteName: article.siteName || null,
		wordCount,
		readingTimeMinutes,
	};
}

// ─── Routes ─────────────────────────────────────────────────

const routes = new Hono();

// ─── Feed (reads from news.curated_articles) ───────────────
//
// Query params:
//   topics  — comma-separated topic slugs (tech,wissenschaft,…). If
//             omitted, all topics are returned.
//   lang    — 'de' | 'en' | 'all' (default 'all')
//   since   — ISO timestamp; only articles published after this
//   limit   — default 50, max 200
//   offset  — default 0
//
// Returns the full article body so the client can render the reader
// without a second round-trip. Curated articles are small (≤30 KB
// each) and the client caches them locally for offline reading.

routes.get('/feed', async (c) => {
	const topicsParam = c.req.query('topics');
	const lang = c.req.query('lang') ?? 'all';
	const since = c.req.query('since');
	const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
	const offset = parseInt(c.req.query('offset') || '0', 10);

	const conditions: ReturnType<typeof sql>[] = [];

	if (topicsParam) {
		const topics = topicsParam
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		if (topics.length > 0) {
			conditions.push(sql`topic = ANY(${topics})`);
		}
	}
	if (lang === 'de' || lang === 'en') {
		conditions.push(sql`language = ${lang}`);
	}
	if (since) {
		conditions.push(sql`published_at > ${since}`);
	}

	const whereClause =
		conditions.length > 0
			? sql.join([sql`WHERE`, sql.join(conditions, sql` AND `)], sql` `)
			: sql``;

	const result = await db.execute(sql`
		SELECT
			id,
			original_url   AS "originalUrl",
			title,
			excerpt,
			content,
			html_content   AS "htmlContent",
			author,
			site_name      AS "siteName",
			source_slug    AS "sourceSlug",
			image_url      AS "imageUrl",
			topic,
			language,
			word_count     AS "wordCount",
			reading_time_minutes AS "readingTimeMinutes",
			published_at   AS "publishedAt",
			ingested_at    AS "ingestedAt"
		FROM news.curated_articles
		${whereClause}
		ORDER BY published_at DESC NULLS LAST, ingested_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`);

	return c.json(result as unknown as Record<string, unknown>[]);
});

// ─── Extract (content extraction for user-pasted URLs) ─────

routes.post('/extract/preview', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'URL is required' }, 400);

	try {
		const article = await extractFromUrl(url);
		return c.json(article);
	} catch (err) {
		return c.json({ error: err instanceof Error ? err.message : 'Extraction failed' }, 500);
	}
});

routes.post('/extract/save', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'URL is required' }, 400);

	try {
		const extracted = await extractFromUrl(url);

		// Return extracted data — client saves to local-first store.
		return c.json({
			id: crypto.randomUUID(),
			type: 'saved',
			sourceOrigin: 'user_saved',
			originalUrl: url,
			title: extracted.title,
			content: extracted.content,
			htmlContent: extracted.htmlContent,
			excerpt: extracted.excerpt,
			author: extracted.byline,
			siteName: extracted.siteName,
			wordCount: extracted.wordCount,
			readingTimeMinutes: extracted.readingTimeMinutes,
			isArchived: false,
		});
	} catch (err) {
		return c.json({ error: err instanceof Error ? err.message : 'Extraction failed' }, 500);
	}
});

export { routes as newsRoutes };
