import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Injectable,
	Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorTrackingService } from './error-tracking.service';

// Sensitive header keys to sanitize before logging
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'api-key'];

// Sensitive body field keys to sanitize
const SENSITIVE_BODY_FIELDS = ['password', 'token', 'secret', 'apikey', 'api_key'];

@Injectable()
@Catch()
export class ErrorTrackingFilter implements ExceptionFilter {
	private readonly logger = new Logger(ErrorTrackingFilter.name);

	constructor(
		private readonly httpAdapterHost: HttpAdapterHost,
		private readonly errorTrackingService: ErrorTrackingService
	) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		const { httpAdapter } = this.httpAdapterHost;
		const ctx = host.switchToHttp();
		const request = ctx.getRequest();
		const response = ctx.getResponse();

		// Determine status code
		const httpStatus =
			exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		// Build error message
		const message =
			exception instanceof Error
				? exception.message
				: typeof exception === 'string'
					? exception
					: 'Internal server error';

		// Build response body
		const responseBody = {
			statusCode: httpStatus,
			timestamp: new Date().toISOString(),
			path: httpAdapter.getRequestUrl(request),
			message,
		};

		// Report error to tracking service (fire and forget)
		this.trackError(exception, request, httpStatus).catch((err) => {
			this.logger.warn('Failed to track error', err);
		});

		// Send response
		httpAdapter.reply(response, responseBody, httpStatus);
	}

	private async trackError(
		exception: unknown,
		request: Record<string, unknown>,
		statusCode: number
	): Promise<void> {
		// Don't track 4xx client errors below 500 by default (optional)
		// You can customize this based on your needs
		const error = exception instanceof Error ? exception : new Error(String(exception));

		const sanitizedHeaders = this.sanitizeHeaders(request.headers as Record<string, unknown>);
		const sanitizedBody = this.sanitizeBody(request.body as Record<string, unknown>);

		await this.errorTrackingService.reportHttpException(
			error,
			{
				url: request.url as string,
				method: request.method as string,
				headers: sanitizedHeaders,
				body: sanitizedBody,
				user: request.user as { userId?: string; sessionId?: string },
			},
			statusCode
		);
	}

	private sanitizeHeaders(headers?: Record<string, unknown>): Record<string, unknown> | undefined {
		if (!headers) return undefined;

		const sanitized: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(headers)) {
			if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
				sanitized[key] = '[REDACTED]';
			} else {
				sanitized[key] = value;
			}
		}
		return sanitized;
	}

	private sanitizeBody(body?: Record<string, unknown>): Record<string, unknown> | undefined {
		if (!body) return undefined;

		const sanitized: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(body)) {
			if (SENSITIVE_BODY_FIELDS.includes(key.toLowerCase())) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'object' && value !== null) {
				sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
			} else {
				sanitized[key] = value;
			}
		}
		return sanitized;
	}
}
