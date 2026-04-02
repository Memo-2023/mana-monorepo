/**
 * Presi Server — Hono + Bun
 *
 * Lightweight server for compute-only endpoints:
 * - Share links (public deck viewing + link management)
 * - Admin (GDPR compliance)
 *
 * All CRUD (decks, slides, themes) is handled client-side via local-first + sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler, notFoundHandler } from '@manacore/shared-hono/error';
import { healthRoute } from '@manacore/shared-hono/health';
import { adminRoutes } from '@manacore/shared-hono/admin';
import { shareRoutes } from './routes/share';
import { db, decks, slides, sharedDecks } from './db';

const app = new Hono();

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Middleware
app.use('*', logger());
app.use(
	'*',
	cors({
		origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5178,http://localhost:5173').split(','),
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Authorization', 'Content-Type', 'X-Service-Key'],
		credentials: true,
	})
);

// Routes
app.route('/health', healthRoute('presi-server'));
app.route('/api/share', shareRoutes);
app.route(
	'/api/v1/admin',
	adminRoutes(db, [
		{ table: sharedDecks, name: 'sharedDecks', userIdColumn: sharedDecks.deckId },
		{ table: slides, name: 'slides', userIdColumn: slides.deckId },
		{ table: decks, name: 'decks', userIdColumn: decks.userId },
	])
);

// Start
const port = Number(process.env.PORT ?? 3008);

console.log(`Presi server (Hono + Bun) starting on port ${port}`);

export default {
	port,
	fetch: app.fetch,
};
