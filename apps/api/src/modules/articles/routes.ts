/**
 * Articles module — server-side URL extraction.
 *
 * Thin wrapper around `@mana/shared-rss`'s Readability pipeline. The
 * extracted payload is returned to the client which then encrypts +
 * stores it locally (and syncs via mana-sync). The server keeps no
 * per-user article state — all reading-list data lives in the unified
 * Mana app's IndexedDB.
 *
 * One endpoint (`POST /extract`), not two. News has a `preview` + `save`
 * split for legacy reasons; here both UI paths (AddUrlForm preview + the
 * direct saveFromUrl path) use the same payload. The client caches the
 * response when the user confirms, avoiding a double server fetch.
 */

import { Hono } from 'hono';
import { extractFromUrl } from '@mana/shared-rss';

const routes = new Hono();

routes.post('/extract', async (c) => {
	const body = await c.req.json<{ url?: string }>().catch(() => ({}) as { url?: string });
	const url = body.url;
	if (!url || typeof url !== 'string') {
		return c.json({ error: 'URL is required' }, 400);
	}

	// Minimal URL shape check — extractFromUrl will no-op on a bad URL but
	// the caller deserves a clear 400 vs a generic 502.
	try {
		new URL(url);
	} catch {
		return c.json({ error: 'Invalid URL' }, 400);
	}

	const extracted = await extractFromUrl(url);
	if (!extracted) {
		return c.json({ error: 'Extraction failed' }, 502);
	}

	return c.json({
		originalUrl: url,
		title: extracted.title,
		excerpt: extracted.excerpt,
		content: extracted.content,
		htmlContent: extracted.htmlContent,
		author: extracted.byline,
		siteName: extracted.siteName,
		wordCount: extracted.wordCount,
		readingTimeMinutes: extracted.readingTimeMinutes,
	});
});

export { routes as articlesRoutes };
