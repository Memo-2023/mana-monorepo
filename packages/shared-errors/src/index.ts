/**
 * @manacore/shared-errors
 *
 * Go-like error handling system for NestJS backends.
 *
 * Features:
 * - Result<T, E> type for explicit error handling
 * - Standardized error codes and HTTP status mappings
 * - Error wrapping with context (like Go's fmt.Errorf)
 * - Type guards for type-safe error checking (like Go's errors.Is/As)
 * - NestJS exception filter for consistent API responses
 *
 * @example
 * ```typescript
 * // In a service
 * import {
 *   Result, ok, err, AsyncResult,
 *   ValidationError, NotFoundError, ServiceError
 * } from '@manacore/shared-errors';
 *
 * async function getUser(id: string): AsyncResult<User> {
 *   if (!isValidId(id)) {
 *     return err(ValidationError.invalidInput('id', 'must be a valid UUID'));
 *   }
 *
 *   const user = await db.findUser(id);
 *   if (!user) {
 *     return err(new NotFoundError('User', id));
 *   }
 *
 *   return ok(user);
 * }
 *
 * // In a controller
 * import { isOk } from '@manacore/shared-errors';
 *
 * const result = await userService.getUser(id);
 * if (!isOk(result)) {
 *   throw result.error; // Caught by AppExceptionFilter
 * }
 * return result.value;
 * ```
 */

// Types
export { ErrorCode, ERROR_CODE_TO_HTTP_STATUS, ERROR_CODE_RETRYABLE } from './types/error-codes';

export {
	type Result,
	type AsyncResult,
	ok,
	err,
	isOk,
	isErr,
	unwrap,
	unwrapOr,
	unwrapOrElse,
	map,
	mapErr,
	andThen,
	match,
	tryCatch,
	tryCatchAsync,
	combine,
	fromNullable,
	toNullable,
} from './types/result';

// Errors
export { AppError, type ErrorContext, type AppErrorOptions } from './errors/app-error';

export { ValidationError } from './errors/validation-error';
export { AuthError } from './errors/auth-error';
export { NotFoundError } from './errors/not-found-error';
export { CreditError } from './errors/credit-error';
export { ServiceError } from './errors/service-error';
export { RateLimitError } from './errors/rate-limit-error';
export { NetworkError } from './errors/network-error';
export { DatabaseError } from './errors/database-error';

// Guards
export {
	isAppError,
	isValidationError,
	isAuthError,
	isNotFoundError,
	isCreditError,
	isServiceError,
	isRateLimitError,
	isNetworkError,
	isDatabaseError,
	hasErrorCode,
	findError,
	isRetryable,
	getHttpStatus,
	getErrorCode,
} from './guards/type-guards';

// Utils
export { wrap, toAppError, cause, rootCause } from './utils/wrap';
