/**
 * Guides Server — Hono + Bun
 *
 * Compute-only server for features that need server-side logic:
 * - Web import: URL → structured guide via mana-search
 * - AI generation: text/paste → guide via mana-llm
 * - Guide sharing: public guide links
 *
 * All CRUD is handled client-side via local-first + mana-sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { importRoutes } from './routes/import.js';
import { shareRoutes } from './routes/share.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
	'*',
	cors({
		origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5200').split(','),
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		allowHeaders: ['Authorization', 'Content-Type'],
		credentials: true,
	})
);

// Routes
app.route('/api/v1/import', importRoutes);
app.route('/api/v1/share', shareRoutes);

// Health check
app.get('/health', (c) =>
	c.json({
		status: 'ok',
		service: 'guides-server',
		runtime: 'bun',
		timestamp: new Date().toISOString(),
	})
);

const port = Number(process.env.PORT ?? 3027);
console.log(`🚀 Guides server (Hono + Bun) starting on port ${port}`);

export default { port, fetch: app.fetch };
