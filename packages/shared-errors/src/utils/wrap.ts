import { AppError, type ErrorContext } from '../errors/app-error';
import { ErrorCode } from '../types/error-codes';
import { isAppError } from '../guards/type-guards';

/**
 * Wrap an error with context.
 * Similar to Go's `fmt.Errorf("context: %w", err)`.
 *
 * @param error - The error to wrap (can be any type)
 * @param context - Description of the operation that failed
 * @param additionalContext - Extra context data to include
 * @returns An AppError with the original as its cause
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   return err(wrap(error, 'fetching user data'));
 * }
 * ```
 */
export function wrap(error: unknown, context: string, additionalContext?: ErrorContext): AppError {
	if (isAppError(error)) {
		return error.wrap(context, additionalContext);
	}

	const message = error instanceof Error ? error.message : String(error);
	return new AppError({
		code: ErrorCode.UNKNOWN_ERROR,
		message: `${context}: ${message}`,
		cause: error instanceof Error ? error : undefined,
		context: additionalContext,
	});
}

/**
 * Convert any error to AppError.
 * If already an AppError, returns it unchanged.
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   return err(toAppError(error));
 * }
 * ```
 */
export function toAppError(error: unknown): AppError {
	if (isAppError(error)) {
		return error;
	}

	if (error instanceof Error) {
		return new AppError({
			code: ErrorCode.UNKNOWN_ERROR,
			message: error.message,
			cause: error,
		});
	}

	return new AppError({
		code: ErrorCode.UNKNOWN_ERROR,
		message: String(error),
	});
}

/**
 * Get the cause of an error.
 *
 * @example
 * ```typescript
 * const originalError = cause(wrappedError);
 * ```
 */
export function cause(error: AppError): Error | undefined {
	return error.cause;
}

/**
 * Get the root cause of an error chain.
 * Traverses all causes to find the original error.
 *
 * @example
 * ```typescript
 * const original = rootCause(deeplyWrappedError);
 * ```
 */
export function rootCause(error: AppError): Error {
	return error.rootCause();
}
