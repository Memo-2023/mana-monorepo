import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';
		let details: any = undefined;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === 'string') {
				message = exceptionResponse;
			} else if (typeof exceptionResponse === 'object') {
				const resp = exceptionResponse as any;
				message = resp.message || message;
				details = resp;
			}
		} else if (exception instanceof Error) {
			message = exception.message;
			console.error('Unhandled exception:', exception);
		}

		response.status(status).json({
			statusCode: status,
			message,
			timestamp: new Date().toISOString(),
			...(details && status !== HttpStatus.INTERNAL_SERVER_ERROR && { details }),
		});
	}
}
