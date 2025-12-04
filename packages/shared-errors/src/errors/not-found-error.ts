import { ErrorCode } from '../types/error-codes';
import { AppError } from './app-error';
import type { ErrorContext } from './app-error';

/**
 * Error for when a requested resource is not found.
 * HTTP Status: 404 Not Found
 *
 * @example
 * ```typescript
 * // Generic resource not found
 * return err(new NotFoundError('User', userId));
 *
 * // Using factory methods
 * return err(NotFoundError.user(userId));
 * return err(NotFoundError.resource('Story', storyId));
 * ```
 */
export class NotFoundError extends AppError {
	constructor(resourceType: string, identifier: string, context?: ErrorContext) {
		super({
			code: ErrorCode.RESOURCE_NOT_FOUND,
			message: `${resourceType} not found: ${identifier}`,
			context: { resourceType, identifier, ...context },
		});
		this.name = 'NotFoundError';
	}

	/**
	 * Create a not found error for a user.
	 */
	static user(userId: string): NotFoundError {
		return new NotFoundError('User', userId);
	}

	/**
	 * Create a not found error for any resource type.
	 */
	static resource(resourceType: string, identifier: string): NotFoundError {
		return new NotFoundError(resourceType, identifier);
	}
}
