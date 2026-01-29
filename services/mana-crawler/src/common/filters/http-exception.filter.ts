import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status: number;
		let message: string;
		let error: string;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();
			message =
				typeof exceptionResponse === 'string'
					? exceptionResponse
					: (exceptionResponse as { message?: string }).message ||
						exception.message;
			error = exception.name;
		} else if (exception instanceof Error) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			message = exception.message;
			error = 'Internal Server Error';
			this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
		} else {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			message = 'An unexpected error occurred';
			error = 'Internal Server Error';
			this.logger.error(`Unknown exception type: ${exception}`);
		}

		response.status(status).json({
			statusCode: status,
			error,
			message,
			timestamp: new Date().toISOString(),
		});
	}
}
