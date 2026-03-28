/**
 * Questions Hono Server — Research via mana-search
 *
 * CRUD for questions/collections/answers handled by mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';
import { consumeCredits, validateCredits } from '@manacore/shared-hono/credits';

const PORT = parseInt(process.env.PORT || '3011', 10);
const SEARCH_URL = process.env.MANA_SEARCH_URL || 'http://localhost:3021';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5111').split(',');

const DEPTH_CONFIG = {
	quick: { limit: 5, extract: false, categories: ['general'] },
	standard: { limit: 15, extract: true, categories: ['general', 'news'] },
	deep: { limit: 30, extract: true, categories: ['general', 'news', 'science', 'it'] },
} as const;

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('questions-server'));
app.use('/api/*', authMiddleware());

// ─── Research (server-only: mana-search) ─────────────────────

app.post('/api/v1/research/start', async (c) => {
	const userId = c.get('userId');
	const { questionId, query, depth } = await c.req.json();

	if (!query) return c.json({ error: 'query required' }, 400);

	const config = DEPTH_CONFIG[depth as keyof typeof DEPTH_CONFIG] || DEPTH_CONFIG.standard;
	const cost = depth === 'deep' ? 25 : depth === 'quick' ? 5 : 10;

	const validation = await validateCredits(userId, 'RESEARCH', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits', required: cost }, 402);
	}

	try {
		// 1. Search via mana-search
		const searchRes = await fetch(`${SEARCH_URL}/api/v1/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query,
				options: { categories: config.categories, limit: config.limit },
			}),
		});

		if (!searchRes.ok) return c.json({ error: 'Search failed' }, 502);
		const searchData = await searchRes.json();
		const results = searchData.results || [];

		// 2. Extract content if standard/deep
		let sources = results.map((r: { url: string; title: string; content?: string }) => ({
			url: r.url,
			title: r.title,
			snippet: r.content?.slice(0, 300),
		}));

		if (config.extract && results.length > 0) {
			const urls = results
				.slice(0, 5)
				.map((r: { url: string; title: string; content?: string }) => r.url)
				.filter(Boolean);
			if (urls.length > 0) {
				const extractRes = await fetch(`${SEARCH_URL}/api/v1/extract/bulk`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ urls }),
				});
				if (extractRes.ok) {
					const extracted = await extractRes.json();
					sources = sources.map((s: { url: string }) => {
						const ext = extracted.results?.find(
							(e: { url: string; content?: string }) => e.url === s.url
						);
						return ext ? { ...s, extractedContent: ext.content?.slice(0, 2000) } : s;
					});
				}
			}
		}

		// 3. Build summary
		const summary = `Gefunden: ${results.length} Quellen für "${query}"`;
		const keyPoints = results
			.slice(0, 3)
			.map((r: { url: string; title: string; content?: string }) => r.title);

		await consumeCredits(userId, 'RESEARCH', cost, `Research: ${query} (${depth})`);

		return c.json({
			questionId,
			summary,
			keyPoints,
			sources,
			depth,
			sourceCount: results.length,
		});
	} catch (_err) {
		return c.json({ error: 'Research failed' }, 500);
	}
});

app.get('/api/v1/research/health/search', async (c) => {
	try {
		const res = await fetch(`${SEARCH_URL}/health`);
		return c.json({ searchService: res.ok ? 'healthy' : 'unhealthy' });
	} catch {
		return c.json({ searchService: 'unreachable' });
	}
});

export default { port: PORT, fetch: app.fetch };
