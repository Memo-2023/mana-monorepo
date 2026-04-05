/**
 * NestJS-specific error tracking integration
 *
 * Provides an exception filter that automatically captures errors
 * and a middleware that sets user context from JWT.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { SentryExceptionFilter } from '@mana/shared-error-tracking/nestjs';
 *
 * @Module({
 *   providers: [
 *     { provide: APP_FILTER, useClass: SentryExceptionFilter },
 *   ],
 * })
 * ```
 */

import {
	type ExceptionFilter,
	Catch,
	type ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { captureException, setUser } from './index';

/**
 * NestJS exception filter that captures errors to GlitchTip/Sentry.
 * Use alongside your existing HttpExceptionFilter or as a replacement.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(SentryExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const request = ctx.getRequest();
		const response = ctx.getResponse();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();
			message =
				typeof exceptionResponse === 'string'
					? exceptionResponse
					: (exceptionResponse as Record<string, unknown>).message?.toString() || message;
		}

		// Only capture 5xx errors to GlitchTip (not 4xx client errors)
		if (status >= 500) {
			captureException(exception, {
				url: request.url,
				method: request.method,
				statusCode: status,
				userId: request.user?.userId || request.user?.sub,
			});
			this.logger.error(
				`[${request.method}] ${request.url} - ${status}: ${message}`,
				exception instanceof Error ? exception.stack : undefined
			);
		} else {
			this.logger.warn(`[${request.method}] ${request.url} - ${status}: ${message}`);
		}

		response.status(status).json({
			statusCode: status,
			message,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}

/**
 * Set Sentry user context from a NestJS request.
 * Call this in a middleware or interceptor after JWT validation.
 */
export function setUserFromRequest(request: {
	user?: { userId?: string; sub?: string; email?: string };
}): void {
	if (request.user) {
		setUser({
			id: request.user.userId || request.user.sub || 'unknown',
			email: request.user.email,
		});
	}
}
