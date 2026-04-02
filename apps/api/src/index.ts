/**
 * ManaCore Unified API Server
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
} from '@manacore/shared-hono';

// Module routes
import { calendarRoutes } from './modules/calendar/routes';
import { contactsRoutes } from './modules/contacts/routes';
import { mukkeRoutes } from './modules/mukke/routes';

const PORT = parseInt(process.env.PORT || '3050', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const app = new Hono();

// ─── Global Middleware ──────────────────────────────────────
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
app.route('/health', healthRoute('mana-api'));
app.use('/api/*', rateLimitMiddleware({ max: 200, windowMs: 60_000 }));
app.use('/api/*', authMiddleware());

// ─── Module Routes ──────────────────────────────────────────
app.route('/api/v1/calendar', calendarRoutes);
app.route('/api/v1/contacts', contactsRoutes);
app.route('/api/v1/mukke', mukkeRoutes);

// ─── Server Info ────────────────────────────────────────────
console.log(`mana-api starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
