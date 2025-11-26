import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  categorizeError,
  getUserFriendlyError,
} from '../../core/consts/user-errors.const';
import { ErrorLoggingService } from '../../core/services/error-logging.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Inject(ErrorLoggingService)
    private readonly errorLoggingService?: ErrorLoggingService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_SERVER_ERROR';
    let details = {};
    let stack: string | undefined;

    const userId = (request as any).user?.sub;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;

        // Check if it's an InsufficientCreditsException - return as-is
        // Check by status code (402) or error field (case-insensitive) or presence of credit details
        const isInsufficientCredits =
          status === 402 ||
          responseObj.error?.toLowerCase() === 'insufficient credits' ||
          responseObj.error?.toLowerCase() === 'insufficient_credits' ||
          (responseObj.details?.requiredCredits !== undefined &&
            responseObj.details?.availableCredits !== undefined);

        if (isInsufficientCredits) {
          this.logger.warn(
            `Insufficient credits for user ${userId}`,
            responseObj,
          );
          // Always return 402 status for credit errors (even if Mana Core sends 400)
          // Don't log to database - credit errors are business logic, not system errors
          response.status(402).json({
            statusCode: 402,
            error: 'insufficient_credits', // Normalize the error field
            message: responseObj.message,
            // Include credit details at top level for mobile compatibility
            requiredCredits: responseObj.details?.requiredCredits,
            availableCredits: responseObj.details?.availableCredits,
            details: responseObj.details, // Keep original details too
            timestamp: new Date().toISOString(),
            path: request.url,
          });
          return;
        }

        message = responseObj.message || message;
        error = responseObj.error || error;
        details = responseObj.details || details;
      } else {
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // Log error details for debugging
    this.logger.error(`Error occurred: ${request.method} ${request.url}`, {
      statusCode: status,
      error,
      message,
      details,
      userId,
    });

    // Categorize error and get user-friendly message
    const category = categorizeError(message);
    const userError = getUserFriendlyError(message, category);

    // Log error for monitoring (only if service is available)
    if (this.errorLoggingService) {
      try {
        await this.errorLoggingService.logError({
          userId,
          errorCategory: category,
          technicalMessage: message,
          technicalStack: stack,
          context: {
            body: request.body,
            query: request.query,
            params: request.params,
          },
          endpoint: request.url,
          userAgent: request.headers['user-agent'],
        });
      } catch (logError) {
        this.logger.error('Failed to log error to database:', logError);
      }
    }

    // Build error response with user-friendly messages
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: category,
      messageDE: userError.messageDE,
      messageEN: userError.messageEN,
      retryable: userError.retryable,
      // Include technical details only in development
      ...(process.env.NODE_ENV === 'development' && {
        technicalMessage: message,
        stack,
        details,
      }),
    });
  }
}
