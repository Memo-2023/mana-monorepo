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
} from '@mana/shared-hono';

// Module routes
import { calendarRoutes } from './modules/calendar/routes';
import { contactsRoutes } from './modules/contacts/routes';
import { musicRoutes } from './modules/music/routes';
import { chatRoutes } from './modules/chat/routes';
import { contextRoutes } from './modules/context/routes';
import { pictureRoutes } from './modules/picture/routes';
import { storageRoutes } from './modules/storage/routes';
import { todoRoutes } from './modules/todo/routes';
import { plantsRoutes } from './modules/plants/routes';
import { foodRoutes } from './modules/food/routes';
import { guidesRoutes } from './modules/guides/routes';
import { moodlitRoutes } from './modules/moodlit/routes';
import { newsRoutes } from './modules/news/routes';
import { tracesRoutes } from './modules/traces/routes';
import { presiRoutes } from './modules/presi/routes';
import { researchRoutes } from './modules/research/routes';
import { whoRoutes } from './modules/who/routes';

const PORT = parseInt(process.env.PORT || '3060', 10);
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
app.route('/api/v1/music', musicRoutes);
app.route('/api/v1/chat', chatRoutes);
app.route('/api/v1/context', contextRoutes);
app.route('/api/v1/picture', pictureRoutes);
app.route('/api/v1/storage', storageRoutes);
app.route('/api/v1/todo', todoRoutes);
app.route('/api/v1/plants', plantsRoutes);
app.route('/api/v1/food', foodRoutes);
app.route('/api/v1/guides', guidesRoutes);
app.route('/api/v1/moodlit', moodlitRoutes);
app.route('/api/v1/news', newsRoutes);
app.route('/api/v1/traces', tracesRoutes);
app.route('/api/v1/presi', presiRoutes);
app.route('/api/v1/research', researchRoutes);
app.route('/api/v1/who', whoRoutes);

// ─── Server Info ────────────────────────────────────────────
console.log(`mana-api starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
