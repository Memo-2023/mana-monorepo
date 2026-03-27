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
import { rruleRoutes } from './routes/rrule';
import { reminderRoutes } from './routes/reminders';
import { adminRoutes } from './routes/admin';

const app = new Hono();

// Middleware
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

// Routes
app.route('/api/v1/compute', rruleRoutes);
app.route('/api/v1', reminderRoutes);
app.route('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', (c) =>
	c.json({
		status: 'ok',
		service: 'todo-server',
		runtime: 'bun',
		timestamp: new Date().toISOString(),
	})
);

// Start
const port = Number(process.env.PORT ?? 3019);

console.log(`🚀 Todo server (Hono + Bun) starting on port ${port}`);

export default {
	port,
	fetch: app.fetch,
};
