/**
 * News module — Article extraction + AI feed
 * Ported from apps/news/apps/server
 *
 * Saved articles handled by local-first + mana-sync.
 * This module handles content extraction (Mozilla Readability) and feed from sync_changes.
 */

import { Hono } from 'hono';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// ─── DB Connection (reads from sync_changes for feed) ───────

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://manacore:devpassword@localhost:5432/mana_sync';

const connection = postgres(DATABASE_URL, { max: 10 });
const db = drizzle(connection);

// ─── Extract Service ────────────────────────────────────────

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

// ─── Feed (public, reads from sync_changes) ─────────────────

routes.get('/feed', async (c) => {
	const type = c.req.query('type');
	const categoryId = c.req.query('categoryId');
	const limit = parseInt(c.req.query('limit') || '20', 10);
	const offset = parseInt(c.req.query('offset') || '0', 10);

	let whereClause = sql`app_id = 'news' AND table_name = 'articles' AND op != 'delete'`;

	if (type) {
		whereClause = sql`${whereClause} AND data->>'type' = ${type}`;
	}
	if (categoryId) {
		whereClause = sql`${whereClause} AND data->>'categoryId' = ${categoryId}`;
	}

	const result = await db.execute(sql`
		SELECT DISTINCT ON (record_id)
			record_id as id,
			data->>'title' as title,
			data->>'excerpt' as excerpt,
			data->>'author' as author,
			data->>'imageUrl' as "imageUrl",
			data->>'type' as type,
			data->>'categoryId' as "categoryId",
			(data->>'wordCount')::int as "wordCount",
			(data->>'readingTimeMinutes')::int as "readingTimeMinutes",
			data->>'publishedAt' as "publishedAt",
			created_at as "createdAt"
		FROM sync_changes
		WHERE ${whereClause}
		ORDER BY record_id, created_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`);

	return c.json(result as unknown as Record<string, unknown>[]);
});

routes.get('/feed/:id', async (c) => {
	const id = c.req.param('id');

	const result = await db.execute(sql`
		SELECT DISTINCT ON (record_id)
			record_id as id,
			data->>'title' as title,
			data->>'content' as content,
			data->>'htmlContent' as "htmlContent",
			data->>'excerpt' as excerpt,
			data->>'author' as author,
			data->>'imageUrl' as "imageUrl",
			data->>'originalUrl' as "originalUrl",
			data->>'type' as type,
			(data->>'wordCount')::int as "wordCount",
			(data->>'readingTimeMinutes')::int as "readingTimeMinutes",
			data->>'publishedAt' as "publishedAt",
			created_at as "createdAt"
		FROM sync_changes
		WHERE app_id = 'news' AND table_name = 'articles' AND record_id = ${id} AND op != 'delete'
		ORDER BY record_id, created_at DESC
		LIMIT 1
	`);

	const rows = result as unknown as Record<string, unknown>[];
	if (!rows[0]) return c.json({ error: 'Article not found' }, 404);
	return c.json(rows[0]);
});

// ─── Extract (content extraction) ───────────────────────────

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

		// Return extracted data -- client saves to local-first store
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
