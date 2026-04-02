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
import { chatRoutes } from './modules/chat/routes';
import { contextRoutes } from './modules/context/routes';
import { pictureRoutes } from './modules/picture/routes';
import { storageRoutes } from './modules/storage/routes';
import { todoRoutes } from './modules/todo/routes';
import { plantaRoutes } from './modules/planta/routes';
import { nutriphiRoutes } from './modules/nutriphi/routes';
import { guidesRoutes } from './modules/guides/routes';
import { moodlitRoutes } from './modules/moodlit/routes';
import { newsRoutes } from './modules/news/routes';
import { tracesRoutes } from './modules/traces/routes';
import { presiRoutes } from './modules/presi/routes';

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
app.route('/api/v1/chat', chatRoutes);
app.route('/api/v1/context', contextRoutes);
app.route('/api/v1/picture', pictureRoutes);
app.route('/api/v1/storage', storageRoutes);
app.route('/api/v1/todo', todoRoutes);
app.route('/api/v1/planta', plantaRoutes);
app.route('/api/v1/nutriphi', nutriphiRoutes);
app.route('/api/v1/guides', guidesRoutes);
app.route('/api/v1/moodlit', moodlitRoutes);
app.route('/api/v1/news', newsRoutes);
app.route('/api/v1/traces', tracesRoutes);
app.route('/api/v1/presi', presiRoutes);

// ─── Server Info ────────────────────────────────────────────
console.log(`mana-api starting on port ${PORT}...`);

export default { port: PORT, fetch: app.fetch };
