/**
 * Traces Hono Server — Compute-only endpoints
 *
 * Handles server-side logic that can't run in the browser:
 * - AI guide generation (mana-llm)
 * - POI discovery (mana-search)
 * - Location sync with city detection
 *
 * CRUD for locations, cities, places, POIs handled by mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@manacore/shared-hono';
import { getDb } from './db';
import { GuideService } from './services/guide';

const PORT = parseInt(process.env.PORT || '3026', 10);
const DB_URL =
	process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/mana_platform';
const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';
const SEARCH_URL = process.env.MANA_SEARCH_URL || 'http://localhost:3021';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const db = getDb(DB_URL);
const guideService = new GuideService(db, LLM_URL, SEARCH_URL);

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));

// Health
app.route('/health', healthRoute('traces-server'));

// All compute routes require auth
app.use('/api/*', authMiddleware());

// ─── Guide Generation (server-only: AI + search) ────────────

app.post('/api/v1/guides/generate', async (c) => {
	const userId = c.get('userId');
	const body = await c.req.json();
	const guide = await guideService.generateGuide(userId, body);
	return c.json(guide, 201);
});

app.get('/api/v1/guides', async (c) => {
	const userId = c.get('userId');
	return c.json(await guideService.getUserGuides(userId));
});

app.get('/api/v1/guides/:id', async (c) => {
	const userId = c.get('userId');
	const guide = await guideService.getGuideDetail(userId, c.req.param('id'));
	if (!guide) return c.json({ error: 'Not found' }, 404);
	return c.json(guide);
});

app.delete('/api/v1/guides/:id', async (c) => {
	const userId = c.get('userId');
	await guideService.deleteGuide(userId, c.req.param('id'));
	return c.json({ success: true });
});

// ─── Location Sync (server-only: city detection) ────────────

app.post('/api/v1/locations/sync', async (c) => {
	const userId = c.get('userId');
	const { items } = await c.req.json();
	// Bulk insert locations + detect cities
	const { locations } = await import('./schema');

	let synced = 0;
	for (const item of items || []) {
		try {
			await db
				.insert(locations)
				.values({
					userId,
					latitude: item.latitude,
					longitude: item.longitude,
					recordedAt: new Date(item.recordedAt),
					accuracy: item.accuracy,
					altitude: item.altitude,
					speed: item.speed,
					source: item.source || 'foreground',
					addressFormatted: item.address,
					city: item.city,
					country: item.country,
					countryCode: item.countryCode,
				})
				.onConflictDoNothing();
			synced++;
		} catch {
			// Skip duplicates
		}
	}

	return c.json({ synced, total: items?.length || 0 });
});

// ─── Start ──────────────────────────────────────────────────

console.log(`traces-server starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
