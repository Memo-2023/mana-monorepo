import {
	type ExceptionFilter,
	Catch,
	type ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type AppError } from '../errors/app-error';
import { isAppError, isCreditError, isRateLimitError } from '../guards/type-guards';
import { ErrorCode } from '../types/error-codes';

/**
 * Standard error response format returned by all backends.
 */
export interface ErrorResponseBody {
	statusCode: number;
	error: string;
	message: string;
	retryable: boolean;
	timestamp: string;
	path: string;
	details?: Record<string, unknown>;
}

/**
 * Global exception filter that converts all errors to a consistent format.
 *
 * Handles:
 * - AppError and subclasses (from shared-errors)
 * - NestJS HttpException
 * - Standard JavaScript Error
 * - Unknown errors
 *
 * @example
 * ```typescript
 * // In main.ts
 * import { AppExceptionFilter } from '@manacore/shared-errors/nestjs';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new AppExceptionFilter());
 *   await app.listen(3000);
 * }
 * ```
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(AppExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const errorResponse = this.buildErrorResponse(exception, request);

		this.logError(exception, request, errorResponse);

		response.status(errorResponse.statusCode).json(errorResponse);
	}

	/**
	 * Build the error response body based on the exception type.
	 */
	private buildErrorResponse(exception: unknown, request: Request): ErrorResponseBody {
		// Handle AppError and subclasses
		if (isAppError(exception)) {
			return this.buildAppErrorResponse(exception, request);
		}

		// Handle NestJS HttpException
		if (exception instanceof HttpException) {
			return this.buildHttpExceptionResponse(exception, request);
		}

		// Handle standard Error
		if (exception instanceof Error) {
			return this.buildStandardErrorResponse(exception, request);
		}

		// Handle unknown errors
		return this.buildUnknownErrorResponse(request);
	}

	/**
	 * Build response for AppError and subclasses.
	 */
	private buildAppErrorResponse(exception: AppError, request: Request): ErrorResponseBody {
		const baseResponse: ErrorResponseBody = {
			statusCode: exception.httpStatus,
			error: exception.code,
			message: exception.message,
			retryable: exception.retryable,
			timestamp: exception.timestamp,
			path: request.url,
		};

		// Add credit-specific fields for CreditError
		if (isCreditError(exception)) {
			baseResponse.details = {
				requiredCredits: exception.requiredCredits,
				availableCredits: exception.availableCredits,
				...exception.context,
			};
		}
		// Add retry-after for RateLimitError
		else if (isRateLimitError(exception) && exception.retryAfter) {
			baseResponse.details = {
				retryAfter: exception.retryAfter,
				...exception.context,
			};
		}
		// Add other context if present
		else if (Object.keys(exception.context).length > 0) {
			baseResponse.details = exception.context;
		}

		return baseResponse;
	}

	/**
	 * Build response for NestJS HttpException.
	 */
	private buildHttpExceptionResponse(
		exception: HttpException,
		request: Request
	): ErrorResponseBody {
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		let message: string;
		let details: Record<string, unknown> | undefined;

		if (typeof exceptionResponse === 'object') {
			const responseObj = exceptionResponse as Record<string, unknown>;
			message =
				typeof responseObj.message === 'string'
					? responseObj.message
					: Array.isArray(responseObj.message)
						? (responseObj.message as string[]).join(', ')
						: exception.message;

			// Extract any additional details
			const { message: _, error: __, statusCode: ___, ...rest } = responseObj;
			if (Object.keys(rest).length > 0) {
				details = rest;
			}
		} else {
			message = String(exceptionResponse);
		}

		return {
			statusCode: status,
			error: this.httpStatusToErrorCode(status),
			message,
			retryable: status >= 500,
			timestamp: new Date().toISOString(),
			path: request.url,
			...(details && { details }),
		};
	}

	/**
	 * Build response for standard JavaScript Error.
	 */
	private buildStandardErrorResponse(exception: Error, request: Request): ErrorResponseBody {
		const isProduction = process.env.NODE_ENV === 'production';

		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			error: ErrorCode.INTERNAL_ERROR,
			message: isProduction ? 'An unexpected error occurred' : exception.message,
			retryable: true,
			timestamp: new Date().toISOString(),
			path: request.url,
		};
	}

	/**
	 * Build response for unknown error types.
	 */
	private buildUnknownErrorResponse(request: Request): ErrorResponseBody {
		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			error: ErrorCode.UNKNOWN_ERROR,
			message: 'An unexpected error occurred',
			retryable: true,
			timestamp: new Date().toISOString(),
			path: request.url,
		};
	}

	/**
	 * Map HTTP status code to ErrorCode.
	 */
	private httpStatusToErrorCode(status: number): string {
		const statusToCode: Record<number, string> = {
			400: ErrorCode.VALIDATION_FAILED,
			401: ErrorCode.AUTHENTICATION_REQUIRED,
			402: ErrorCode.PAYMENT_REQUIRED,
			403: ErrorCode.PERMISSION_DENIED,
			404: ErrorCode.RESOURCE_NOT_FOUND,
			409: ErrorCode.CONFLICT,
			429: ErrorCode.RATE_LIMIT_EXCEEDED,
			500: ErrorCode.INTERNAL_ERROR,
			502: ErrorCode.EXTERNAL_SERVICE_ERROR,
			503: ErrorCode.SERVICE_UNAVAILABLE,
			504: ErrorCode.TIMEOUT,
		};
		return statusToCode[status] || ErrorCode.UNKNOWN_ERROR;
	}

	/**
	 * Log the error with appropriate level based on status code.
	 */
	private logError(exception: unknown, request: Request, response: ErrorResponseBody): void {
		const logData = {
			method: request.method,
			url: request.url,
			statusCode: response.statusCode,
			error: response.error,
			message: response.message,
			userId: (request as Request & { user?: { sub?: string } }).user?.sub,
		};

		// Log 5xx errors as errors, others as warnings
		if (response.statusCode >= 500) {
			this.logger.error(
				`[${logData.method}] ${logData.url} - ${logData.statusCode}: ${logData.message}`,
				isAppError(exception)
					? JSON.stringify(exception.toFullJSON(), null, 2)
					: exception instanceof Error
						? exception.stack
						: undefined
			);
		} else {
			this.logger.warn(
				`[${logData.method}] ${logData.url} - ${logData.statusCode}: ${logData.message}`
			);
		}
	}
}
