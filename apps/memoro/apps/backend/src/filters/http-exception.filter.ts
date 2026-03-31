import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';

/**
 * Global exception filter to handle HTTP exceptions
 * Ensures proper error responses, especially for InsufficientCreditsException
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		// Log the error for debugging
		this.logger.error(`HTTP ${status} Error: ${exception.message}`, exception.stack);

		// Ensure InsufficientCreditsException returns 402 status
		if (exception instanceof InsufficientCreditsException) {
			return response.status(HttpStatus.PAYMENT_REQUIRED).json(exceptionResponse);
		}

		// For other exceptions, return the standard response
		response.status(status).json(exceptionResponse);
	}
}
