import { AppError } from '../errors/app-error';
import { ValidationError } from '../errors/validation-error';
import { AuthError } from '../errors/auth-error';
import { NotFoundError } from '../errors/not-found-error';
import { CreditError } from '../errors/credit-error';
import { ServiceError } from '../errors/service-error';
import { RateLimitError } from '../errors/rate-limit-error';
import { NetworkError } from '../errors/network-error';
import { DatabaseError } from '../errors/database-error';
import { ErrorCode } from '../types/error-codes';

/**
 * Check if error is an AppError.
 * Similar to Go's `errors.As()`.
 *
 * @example
 * ```typescript
 * if (isAppError(error)) {
 *   console.log(error.code); // TypeScript knows error is AppError
 * }
 * ```
 */
export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

/**
 * Check if error is a ValidationError.
 */
export function isValidationError(error: unknown): error is ValidationError {
	return error instanceof ValidationError;
}

/**
 * Check if error is an AuthError.
 */
export function isAuthError(error: unknown): error is AuthError {
	return error instanceof AuthError;
}

/**
 * Check if error is a NotFoundError.
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
	return error instanceof NotFoundError;
}

/**
 * Check if error is a CreditError.
 */
export function isCreditError(error: unknown): error is CreditError {
	return error instanceof CreditError;
}

/**
 * Check if error is a ServiceError.
 */
export function isServiceError(error: unknown): error is ServiceError {
	return error instanceof ServiceError;
}

/**
 * Check if error is a RateLimitError.
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
	return error instanceof RateLimitError;
}

/**
 * Check if error is a NetworkError.
 */
export function isNetworkError(error: unknown): error is NetworkError {
	return error instanceof NetworkError;
}

/**
 * Check if error is a DatabaseError.
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
	return error instanceof DatabaseError;
}

/**
 * Check if error has a specific error code.
 * Similar to Go's `errors.Is()`.
 *
 * @example
 * ```typescript
 * if (hasErrorCode(error, ErrorCode.INSUFFICIENT_CREDITS)) {
 *   showUpgradePrompt();
 * }
 * ```
 */
export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
	if (!isAppError(error)) {
		return false;
	}
	return error.hasCode(code);
}

/**
 * Find the first error in the chain matching a predicate.
 * Traverses the cause chain looking for a matching error.
 *
 * @example
 * ```typescript
 * const creditError = findError(error, isCreditError);
 * if (creditError) {
 *   console.log('Required:', creditError.requiredCredits);
 * }
 * ```
 */
export function findError<T extends AppError>(
	error: unknown,
	predicate: (e: AppError) => e is T
): T | undefined {
	let current: unknown = error;
	while (current) {
		if (isAppError(current) && predicate(current)) {
			return current;
		}
		current = isAppError(current) ? current.cause : undefined;
	}
	return undefined;
}

/**
 * Check if error is retryable.
 * Works with both AppError and standard Error.
 */
export function isRetryable(error: unknown): boolean {
	if (isAppError(error)) {
		return error.retryable;
	}
	return false;
}

/**
 * Get the HTTP status code for an error.
 * Returns 500 for non-AppError errors.
 */
export function getHttpStatus(error: unknown): number {
	if (isAppError(error)) {
		return error.httpStatus;
	}
	return 500;
}

/**
 * Get the error code for an error.
 * Returns UNKNOWN_ERROR for non-AppError errors.
 */
export function getErrorCode(error: unknown): ErrorCode {
	if (isAppError(error)) {
		return error.code;
	}
	return ErrorCode.UNKNOWN_ERROR;
}
