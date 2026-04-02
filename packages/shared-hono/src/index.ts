/**
 * @manacore/shared-hono — Shared infrastructure for Hono + Bun compute servers.
 *
 * Replaces NestJS boilerplate (Module, Controller, Guard, HealthModule, MetricsModule)
 * with lightweight Hono equivalents.
 *
 * Usage:
 * ```ts
 * import { Hono } from 'hono';
 * import { cors } from 'hono/cors';
 * import { logger } from 'hono/logger';
 * import { authMiddleware, serviceAuthMiddleware } from '@manacore/shared-hono/auth';
 * import { createDb } from '@manacore/shared-hono/db';
 * import { healthRoute } from '@manacore/shared-hono/health';
 * import { adminRoutes } from '@manacore/shared-hono/admin';
 * import { errorHandler, notFoundHandler } from '@manacore/shared-hono/error';
 *
 * const app = new Hono();
 * app.onError(errorHandler);
 * app.notFound(notFoundHandler);
 * app.use('*', logger());
 * app.use('*', cors({ origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'] }));
 *
 * app.route('/health', healthRoute('my-server'));
 * app.use('/api/*', authMiddleware());
 * app.route('/api/v1/admin', adminRoutes(db, userTables));
 *
 * // App-specific compute routes
 * app.route('/api/v1/compute', myRoutes);
 *
 * export default { port: Number(process.env.PORT ?? 3019), fetch: app.fetch };
 * ```
 */

export { authMiddleware, serviceAuthMiddleware } from './auth';
export { createDb } from './db';
export type { DbOptions } from './db';
export { healthRoute } from './health';
export { adminRoutes } from './admin';
export { errorHandler, notFoundHandler } from './error';
export { getBalance, validateCredits, consumeCredits, refundCredits } from './credits';
export type { CreditBalance, CreditValidationResult } from './credits';
export { rateLimitMiddleware } from './rate-limit';
export { requestLogger, initLogger } from './logger';
export type { CurrentUserData, AuthVariables } from './types';
