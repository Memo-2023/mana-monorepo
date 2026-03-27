/**
 * Error handling middleware for Hono servers.
 *
 * Catches unhandled errors and returns consistent JSON responses.
 */

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Global error handler — register with `app.onError(errorHandler)`.
 *
 * Usage:
 * ```ts
 * import { errorHandler } from '@manacore/shared-hono/error';
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

	console.error('[error]', err);

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
