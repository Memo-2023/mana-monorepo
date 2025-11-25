import { AppError } from '../errors/app-error';
import { ErrorCode } from './error-codes';

/**
 * Result type representing either success or failure.
 * Inspired by Go's (value, error) return pattern and Rust's Result type.
 *
 * @example
 * ```typescript
 * // In a service
 * async function getUser(id: string): AsyncResult<User> {
 *   const user = await db.findUser(id);
 *   if (!user) {
 *     return err(new NotFoundError('User', id));
 *   }
 *   return ok(user);
 * }
 *
 * // In a controller (Go-like explicit unwrap)
 * const result = await userService.getUser(id);
 * if (!isOk(result)) {
 *   throw result.error;
 * }
 * return result.value;
 * ```
 */
export type Result<T, E extends AppError = AppError> =
  | { readonly ok: true; readonly value: T; readonly error?: never }
  | { readonly ok: false; readonly error: E; readonly value?: never };

/**
 * Async version of Result - use this as return type for async functions.
 */
export type AsyncResult<T, E extends AppError = AppError> = Promise<Result<T, E>>;

/**
 * Create a success Result.
 *
 * @example
 * ```typescript
 * return ok({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create a failure Result.
 *
 * @example
 * ```typescript
 * return err(new ValidationError('Invalid email'));
 * return err(NotFoundError.user(userId));
 * ```
 */
export function err<E extends AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Check if Result is success.
 * Use this for type narrowing in conditionals.
 *
 * @example
 * ```typescript
 * const result = await service.getData();
 * if (isOk(result)) {
 *   console.log(result.value); // TypeScript knows value exists
 * }
 * ```
 */
export function isOk<T, E extends AppError>(
  result: Result<T, E>
): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Check if Result is failure.
 * Use this for type narrowing in conditionals.
 *
 * @example
 * ```typescript
 * const result = await service.getData();
 * if (isErr(result)) {
 *   console.error(result.error.message); // TypeScript knows error exists
 * }
 * ```
 */
export function isErr<T, E extends AppError>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return result.ok === false;
}

/**
 * Unwrap the value or throw if error.
 * Use sparingly - prefer explicit error checking.
 *
 * @throws The error if Result is a failure
 *
 * @example
 * ```typescript
 * // Use when you want to propagate errors as exceptions
 * const value = unwrap(result);
 * ```
 */
export function unwrap<T, E extends AppError>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap the value or return a default value.
 *
 * @example
 * ```typescript
 * const users = unwrapOr(result, []); // Returns [] if error
 * ```
 */
export function unwrapOr<T, E extends AppError>(
  result: Result<T, E>,
  defaultValue: T
): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Unwrap the value or compute a default from the error.
 *
 * @example
 * ```typescript
 * const value = unwrapOrElse(result, (error) => {
 *   console.error('Failed:', error.message);
 *   return fallbackValue;
 * });
 * ```
 */
export function unwrapOrElse<T, E extends AppError>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  return isOk(result) ? result.value : fn(result.error);
}

/**
 * Map the success value to a new value.
 *
 * @example
 * ```typescript
 * const result = await getUser(id);
 * const nameResult = map(result, user => user.name);
 * ```
 */
export function map<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/**
 * Map the error to a new error.
 *
 * @example
 * ```typescript
 * const result = mapErr(originalResult, error =>
 *   error.wrap('while processing user')
 * );
 * ```
 */
export function mapErr<T, E extends AppError, F extends AppError>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/**
 * Chain Results (flatMap) - use when the mapping function returns a Result.
 *
 * @example
 * ```typescript
 * const result = andThen(getUserResult, user =>
 *   getPermissions(user.id)
 * );
 * ```
 */
export function andThen<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/**
 * Pattern matching for Result - handle both success and failure cases.
 *
 * @example
 * ```typescript
 * const message = match(result, {
 *   ok: (user) => `Welcome, ${user.name}!`,
 *   err: (error) => `Error: ${error.message}`,
 * });
 * ```
 */
export function match<T, E extends AppError, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U {
  return isOk(result) ? handlers.ok(result.value) : handlers.err(result.error);
}

/**
 * Try to execute a synchronous function and wrap in Result.
 *
 * @example
 * ```typescript
 * const result = tryCatch(() => JSON.parse(jsonString));
 * ```
 */
export function tryCatch<T>(fn: () => T): Result<T, AppError> {
  try {
    return ok(fn());
  } catch (error) {
    if (error instanceof AppError) {
      return err(error);
    }
    return err(
      new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Try to execute an async function and wrap in Result.
 *
 * @example
 * ```typescript
 * const result = await tryCatchAsync(() => fetch(url).then(r => r.json()));
 * ```
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): AsyncResult<T, AppError> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof AppError) {
      return err(error);
    }
    return err(
      new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Combine multiple Results - returns first error or array of all values.
 *
 * @example
 * ```typescript
 * const results = await Promise.all([
 *   getUser(id1),
 *   getUser(id2),
 *   getUser(id3),
 * ]);
 * const combined = combine(results);
 * if (isOk(combined)) {
 *   const [user1, user2, user3] = combined.value;
 * }
 * ```
 */
export function combine<T, E extends AppError>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Convert a nullable value to a Result.
 *
 * @example
 * ```typescript
 * const result = fromNullable(
 *   maybeUser,
 *   () => new NotFoundError('User', id)
 * );
 * ```
 */
export function fromNullable<T, E extends AppError>(
  value: T | null | undefined,
  errorFn: () => E
): Result<T, E> {
  return value != null ? ok(value) : err(errorFn());
}

/**
 * Convert a Result to a nullable value (loses error information).
 *
 * @example
 * ```typescript
 * const user = toNullable(result); // User | null
 * ```
 */
export function toNullable<T, E extends AppError>(
  result: Result<T, E>
): T | null {
  return isOk(result) ? result.value : null;
}
