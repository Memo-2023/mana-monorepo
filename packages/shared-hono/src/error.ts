/**
 * Error handling middleware for Hono servers.
 *
 * Catches unhandled errors and returns consistent JSON responses.
 */

import type { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from '@mana/shared-logger';

/**
 * Global error handler — register with `app.onError(errorHandler)`.
 *
 * Usage:
 * ```ts
 * import { errorHandler } from '@mana/shared-hono/error';
 * const app = new Hono();
 * app.onError(errorHandler);
 * ```
 */
export function errorHandler(err: Error, c: Context) {
	if (err instanceof HTTPException) {
		return c.json(
			{
				error: err.message,
				status: err.status,
			},
			err.status
		);
	}

	logger.error('unhandled', {
		path: c.req.path,
		method: c.req.method,
		message: err.message,
		stack: err.stack,
	});

	return c.json(
		{
			error: 'Internal server error',
			status: 500,
		},
		500
	);
}

/**
 * Not-found handler — register with `app.notFound(notFoundHandler)`.
 */
export function notFoundHandler(c: Context) {
	return c.json({ error: 'Not found', status: 404 }, 404);
}

/**
 * Service-style error handler — returns the legacy `{ statusCode, message }`
 * envelope used by `services/mana-{credits,user,analytics,subscriptions,
 * auth,events}`. Distinct from the `{ error, status }` shape returned by
 * `errorHandler` above (used by `apps/api`).
 *
 * Replaces 5 byte-identical copies of `src/middleware/error-handler.ts`
 * across services. Wire-compatible with their existing clients —
 * including the `details` field that gets populated from
 * `HTTPException.cause`.
 *
 * Usage:
 * ```ts
 * import { serviceErrorHandler } from '@mana/shared-hono';
 * const app = new Hono();
 * app.onError(serviceErrorHandler);
 * ```
 *
 * Logs unhandled errors via `@mana/shared-logger` so structured JSON
 * lines land in the production log sink instead of `console.error`.
 */
export const serviceErrorHandler: ErrorHandler = (err, c) => {
	if (err instanceof HTTPException) {
		const cause = err.cause as Record<string, unknown> | undefined;
		return c.json(
			{
				statusCode: err.status,
				message: err.message,
				...(cause ? { details: cause } : {}),
			},
			err.status
		);
	}

	logger.error('unhandled', {
		path: c.req.path,
		method: c.req.method,
		message: err.message,
		stack: err.stack,
	});

	return c.json(
		{
			statusCode: 500,
			message: 'Internal server error',
		},
		500
	);
};
