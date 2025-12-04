import {
	type ExceptionFilter,
	Catch,
	type ArgumentsHost,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { type Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';
		let errors: any = undefined;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === 'string') {
				message = exceptionResponse;
			} else if (typeof exceptionResponse === 'object') {
				message = (exceptionResponse as any).message || message;
				errors = (exceptionResponse as any).errors;
			}
		} else if (exception instanceof Error) {
			message = exception.message;
		}

		const errorResponse = {
			statusCode: status,
			message,
			...(errors && { errors }),
			timestamp: new Date().toISOString(),
			path: request.url,
		};

		response.status(status).json(errorResponse);
	}
}
