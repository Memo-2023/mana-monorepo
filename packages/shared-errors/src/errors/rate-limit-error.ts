import { ErrorCode } from '../types/error-codes';
import { AppError } from './app-error';

/**
 * Error for rate limiting.
 * HTTP Status: 429 Too Many Requests
 *
 * @example
 * ```typescript
 * // Basic rate limit error
 * return err(new RateLimitError());
 *
 * // With retry-after information
 * return err(new RateLimitError('Too many requests', 60));
 * // Client should wait 60 seconds before retrying
 * ```
 */
export class RateLimitError extends AppError {
	/** Seconds to wait before retrying (if known) */
	readonly retryAfter?: number;

	constructor(message = 'Rate limit exceeded', retryAfter?: number) {
		super({
			code: ErrorCode.RATE_LIMIT_EXCEEDED,
			message,
			context: retryAfter ? { retryAfter } : {},
		});
		this.name = 'RateLimitError';
		this.retryAfter = retryAfter;
	}
}
