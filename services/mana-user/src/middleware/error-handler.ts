/**
 * Global error handler middleware for Hono.
 */

import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler: ErrorHandler = (err, c) => {
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

	console.error('Unhandled error:', err);
	return c.json(
		{
			statusCode: 500,
			message: 'Internal server error',
		},
		500
	);
};
