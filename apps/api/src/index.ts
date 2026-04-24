/**
 * Mana Unified API Server
 *
 * Consolidates all app compute servers into one Hono/Bun process.
 * Each module registers its routes under /api/v1/{module}/*.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
	authMiddleware,
	healthRoute,
	errorHandler,
	notFoundHandler,
	rateLimitMiddleware,
	requireTier,
	type AuthVariables,
} from '@mana/shared-hono';

// MCP server
import { handleMcpRequest } from './mcp/server';

// Prometheus metrics
import { register as metricsRegister } from './lib/metrics';

// Module routes
import { calendarRoutes } from './modules/calendar/routes';
import { contactsRoutes } from './modules/contacts/routes';
import { musicRoutes } from './modules/music/routes';
import { chatRoutes } from './modules/chat/routes';
import { contextRoutes } from './modules/context/routes';
import { pictureRoutes } from './modules/picture/routes';
import { profileRoutes } from './modules/profile/routes';
import { wardrobeRoutes } from './modules/wardrobe/routes';
import { storageRoutes } from './modules/storage/routes';
import { todoRoutes } from './modules/todo/routes';
import { plantsRoutes } from './modules/plants/routes';
import { foodRoutes } from './modules/food/routes';
import { guidesRoutes } from './modules/guides/routes';
import { moodlitRoutes } from './modules/moodlit/routes';
import { newsRoutes } from './modules/news/routes';
import { newsResearchRoutes } from './modules/news-research/routes';
import { articlesRoutes } from './modules/articles/routes';
import { tracesRoutes } from './modules/traces/routes';
import { writingRoutes } from './modules/writing/routes';
import { comicRoutes } from './modules/comic/routes';
import { presiRoutes } from './modules/presi/routes';
import { researchRoutes } from './modules/research/routes';
import { whoRoutes } from './modules/who/routes';
import { websiteRoutes } from './modules/website/routes';
import { websitePublicRoutes } from './modules/website/public-routes';
import { wetterRoutes } from './modules/wetter/routes';

const PORT = parseInt(process.env.PORT || '3060', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono<{ Variables: AuthVariables }>();

// ─── Global Middleware ──────────────────────────────────────
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('mana-api'));

// Prometheus scrape endpoint. Unauthenticated on purpose — the Grafana
// / Prometheus stack runs on the internal network; we rely on the
// reverse-proxy layer to block external access to /metrics.
app.get('/metrics', async (c) => {
	c.header('Content-Type', metricsRegister.contentType);
	return c.text(await metricsRegister.metrics());
});

app.use('/api/*', rateLimitMiddleware({ max: 200, windowMs: 60_000 }));

// Public routes — no auth required (weather data is public, published
// websites are by definition public).
app.route('/api/v1/wetter', wetterRoutes);
app.route('/api/v1/website/public', websitePublicRoutes);

app.use('/api/*', authMiddleware());

// ─── Tier Gating ────────────────────────────────────────────
// Defense-in-depth on top of per-route credits validation.
// Routes that call LLMs, image-gen, or external search APIs are gated
// to `beta`+ so that unauthenticated guest fallbacks (tier='public'
// from a missing claim) can't hit paid infrastructure.
// Pure CRUD modules (calendar, contacts, music, storage, todo, news,
// presi, moodlit) rely on authMiddleware alone — users access only
// their own records.
const RESOURCE_MODULES = [
	'chat',
	'context',
	'food',
	'guides',
	'news-research',
	'picture',
	'plants',
	'research',
	'traces',
	'who',
	'writing',
] as const;
for (const mod of RESOURCE_MODULES) {
	app.use(`/api/v1/${mod}/*`, requireTier('beta'));
}

// ─── MCP Endpoint ──────────────────────────────────────────
// Streamable HTTP transport: POST (messages), GET (SSE stream), DELETE (close)
// MCP exposes the full tool catalog including LLM/research tools, so it
// gets the same minimum tier.
app.use('/api/v1/mcp', requireTier('beta'));
app.all('/api/v1/mcp', (c) => handleMcpRequest(c.req.raw, c.get('userId')));

// ─── Module Routes ──────────────────────────────────────────
app.route('/api/v1/calendar', calendarRoutes);
app.route('/api/v1/contacts', contactsRoutes);
app.route('/api/v1/music', musicRoutes);
app.route('/api/v1/chat', chatRoutes);
app.route('/api/v1/context', contextRoutes);
app.route('/api/v1/picture', pictureRoutes);
app.route('/api/v1/profile', profileRoutes);
app.route('/api/v1/wardrobe', wardrobeRoutes);
app.route('/api/v1/storage', storageRoutes);
app.route('/api/v1/todo', todoRoutes);
app.route('/api/v1/plants', plantsRoutes);
app.route('/api/v1/food', foodRoutes);
app.route('/api/v1/guides', guidesRoutes);
app.route('/api/v1/moodlit', moodlitRoutes);
app.route('/api/v1/news', newsRoutes);
app.route('/api/v1/news-research', newsResearchRoutes);
app.route('/api/v1/articles', articlesRoutes);
app.route('/api/v1/traces', tracesRoutes);
app.route('/api/v1/presi', presiRoutes);
app.route('/api/v1/research', researchRoutes);
app.route('/api/v1/website', websiteRoutes);
app.route('/api/v1/who', whoRoutes);
app.route('/api/v1/writing', writingRoutes);
app.route('/api/v1/comic', comicRoutes);

// ─── Server Info ────────────────────────────────────────────
console.log(`mana-api starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
