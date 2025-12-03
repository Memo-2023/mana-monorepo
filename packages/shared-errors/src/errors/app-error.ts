import {
	type ErrorCode,
	ERROR_CODE_TO_HTTP_STATUS,
	ERROR_CODE_RETRYABLE,
} from '../types/error-codes';

/**
 * Additional context that can be attached to errors.
 */
export interface ErrorContext {
	[key: string]: unknown;
}

/**
 * Options for creating an AppError.
 */
export interface AppErrorOptions {
	code: ErrorCode;
	message: string;
	cause?: Error | AppError;
	context?: ErrorContext;
	httpStatus?: number;
	retryable?: boolean;
}

/**
 * Base error class for all application errors.
 *
 * Follows Go-like error handling principles:
 * - Errors are values, not exceptions
 * - Support for error wrapping with context
 * - Type-safe error checking
 *
 * @example
 * ```typescript
 * // Create a basic error
 * const error = new AppError({
 *   code: ErrorCode.VALIDATION_FAILED,
 *   message: 'Invalid email format',
 * });
 *
 * // Wrap an error with context (Go-like)
 * const wrapped = error.wrap('validating user input');
 * // Message becomes: "validating user input: Invalid email format"
 *
 * // Check error codes (like Go's errors.Is)
 * if (error.hasCode(ErrorCode.VALIDATION_FAILED)) {
 *   // Handle validation error
 * }
 * ```
 */
export class AppError extends Error {
	/** Standardized error code */
	readonly code: ErrorCode;

	/** HTTP status code for API responses */
	readonly httpStatus: number;

	/** Whether the operation can be retried */
	readonly retryable: boolean;

	/** Original error that caused this error (for wrapping) */
	readonly cause?: Error | AppError;

	/** Additional context information */
	readonly context: ErrorContext;

	/** Timestamp when error was created */
	readonly timestamp: string;

	constructor(options: AppErrorOptions) {
		super(options.message);
		this.name = 'AppError';
		this.code = options.code;
		this.cause = options.cause;
		this.context = options.context ?? {};
		this.timestamp = new Date().toISOString();

		// Use provided values or defaults from mappings
		this.httpStatus = options.httpStatus ?? ERROR_CODE_TO_HTTP_STATUS[options.code];
		this.retryable = options.retryable ?? ERROR_CODE_RETRYABLE[options.code];

		// Capture stack trace
		Error.captureStackTrace(this, this.constructor);
	}

	/**
	 * Create a wrapped error with additional context.
	 * Similar to Go's `fmt.Errorf("context: %w", err)`.
	 *
	 * @param contextMessage - Description of the operation that failed
	 * @param additionalContext - Extra context data to include
	 * @returns A new AppError with the original as its cause
	 *
	 * @example
	 * ```typescript
	 * const wrapped = originalError.wrap('fetching user data');
	 * // Message: "fetching user data: original message"
	 * ```
	 */
	wrap(contextMessage: string, additionalContext?: ErrorContext): AppError {
		return new AppError({
			code: this.code,
			message: `${contextMessage}: ${this.message}`,
			cause: this,
			context: { ...this.context, ...additionalContext },
			httpStatus: this.httpStatus,
			retryable: this.retryable,
		});
	}

	/**
	 * Get the root cause of the error chain.
	 * Traverses the cause chain to find the original error.
	 */
	rootCause(): Error {
		let current: Error = this;
		while (current instanceof AppError && current.cause) {
			current = current.cause;
		}
		return current;
	}

	/**
	 * Check if this error or any in the chain has the given code.
	 * Similar to Go's `errors.Is()`.
	 *
	 * @param code - The error code to check for
	 * @returns true if this error or any cause has the given code
	 *
	 * @example
	 * ```typescript
	 * if (error.hasCode(ErrorCode.INSUFFICIENT_CREDITS)) {
	 *   // Show upgrade prompt
	 * }
	 * ```
	 */
	hasCode(code: ErrorCode): boolean {
		let current: Error | undefined = this;
		while (current) {
			if (current instanceof AppError && current.code === code) {
				return true;
			}
			current = current instanceof AppError ? current.cause : undefined;
		}
		return false;
	}

	/**
	 * Convert to JSON for API responses.
	 * Excludes stack traces and internal details.
	 */
	toJSON(): Record<string, unknown> {
		return {
			code: this.code,
			message: this.message,
			httpStatus: this.httpStatus,
			retryable: this.retryable,
			timestamp: this.timestamp,
			...(Object.keys(this.context).length > 0 && { details: this.context }),
		};
	}

	/**
	 * Convert to full JSON including stack and cause (for logging).
	 * Use this for server-side logging, not client responses.
	 */
	toFullJSON(): Record<string, unknown> {
		return {
			...this.toJSON(),
			stack: this.stack,
			cause: this.cause instanceof AppError ? this.cause.toFullJSON() : this.cause?.message,
		};
	}
}
