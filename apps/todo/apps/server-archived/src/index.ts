/**
 * Todo Server — Hono + Bun
 *
 * Lightweight server for compute-only endpoints:
 * - RRULE expansion (recurring tasks)
 * - Reminders (push/email notifications)
 * - Admin (GDPR compliance)
 *
 * All CRUD is handled client-side via local-first + sync.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import {
	authMiddleware,
	healthRoute,
	errorHandler,
	notFoundHandler,
	rateLimitMiddleware,
} from '@manacore/shared-hono';
import { rruleRoutes } from './routes/rrule';
import { reminderRoutes } from './routes/reminders';
import { adminRoutes } from './routes/admin';
import { startReminderWorker } from './lib/reminder-worker';

const app = new Hono();

// Middleware
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.use('*', logger());
app.use(
	'*',
	cors({
		origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5188,http://localhost:5173').split(','),
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Authorization', 'Content-Type', 'X-Service-Key', 'X-Client-Id'],
		credentials: true,
	})
);
app.route('/health', healthRoute('todo-server'));
app.use('/api/*', rateLimitMiddleware({ max: 100, windowMs: 60_000 }));
app.use('/api/*', authMiddleware());

// Routes
app.route('/api/v1/compute', rruleRoutes);
app.route('/api/v1', reminderRoutes);
app.route('/api/v1/admin', adminRoutes);

// Start
const port = Number(process.env.PORT ?? 3019);

// Start background worker for reminder notifications
startReminderWorker();

console.log(`🚀 Todo server (Hono + Bun) starting on port ${port}`);

export default {
	port,
	fetch: app.fetch,
};
