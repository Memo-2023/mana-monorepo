import { ErrorCode } from '../types/error-codes';
import { AppError, type ErrorContext } from './app-error';

type ServiceErrorCode =
	| ErrorCode.INTERNAL_ERROR
	| ErrorCode.SERVICE_UNAVAILABLE
	| ErrorCode.GENERATION_FAILED
	| ErrorCode.EXTERNAL_SERVICE_ERROR;

/**
 * Error for service-level failures (internal errors, external API failures, etc.).
 * HTTP Status: 500 (internal), 502 (external), 503 (unavailable)
 *
 * @example
 * ```typescript
 * // AI generation failed
 * return err(ServiceError.generationFailed('OpenAI', 'Rate limit exceeded', originalError));
 *
 * // External service unavailable
 * return err(ServiceError.unavailable('Payment Service'));
 *
 * // External API error
 * return err(ServiceError.externalError('Stripe', 'Card declined'));
 *
 * // Internal error
 * return err(ServiceError.internal('Failed to process request'));
 * ```
 */
export class ServiceError extends AppError {
	constructor(code: ServiceErrorCode, message: string, cause?: Error, context?: ErrorContext) {
		super({ code, message, cause, context });
		this.name = 'ServiceError';
	}

	/**
	 * Create an error for AI/content generation failures.
	 *
	 * @param service - Name of the service (e.g., 'OpenAI', 'Azure OpenAI')
	 * @param reason - Why the generation failed
	 * @param cause - Original error if available
	 */
	static generationFailed(service: string, reason: string, cause?: Error): ServiceError {
		return new ServiceError(
			ErrorCode.GENERATION_FAILED,
			`${service} generation failed: ${reason}`,
			cause,
			{ service }
		);
	}

	/**
	 * Create an error for a service that is temporarily unavailable.
	 *
	 * @param service - Name of the unavailable service
	 */
	static unavailable(service: string): ServiceError {
		return new ServiceError(
			ErrorCode.SERVICE_UNAVAILABLE,
			`${service} is temporarily unavailable`,
			undefined,
			{ service }
		);
	}

	/**
	 * Create an error for external API failures.
	 *
	 * @param service - Name of the external service
	 * @param message - Error message or description
	 * @param cause - Original error if available
	 */
	static externalError(service: string, message: string, cause?: Error): ServiceError {
		return new ServiceError(
			ErrorCode.EXTERNAL_SERVICE_ERROR,
			`${service} error: ${message}`,
			cause,
			{ service }
		);
	}

	/**
	 * Create an internal server error.
	 *
	 * @param message - Description of what went wrong
	 * @param cause - Original error if available
	 */
	static internal(message: string, cause?: Error): ServiceError {
		return new ServiceError(ErrorCode.INTERNAL_ERROR, message, cause);
	}
}
