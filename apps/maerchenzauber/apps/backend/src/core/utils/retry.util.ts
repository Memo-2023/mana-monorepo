import { Logger } from '@nestjs/common';

export interface RetryOptions {
	maxAttempts?: number;
	delay?: number;
	backoff?: number;
	maxDelay?: number;
	onRetry?: (error: Error, attempt: number) => void;
	shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
	maxAttempts: 3,
	delay: 1000,
	backoff: 2,
	maxDelay: 30000,
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
	logger?: Logger
): Promise<T> {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	let lastError: Error;

	for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			// Check if we should retry
			if (options.shouldRetry && !options.shouldRetry(lastError)) {
				throw lastError;
			}

			// Don't retry on the last attempt
			if (attempt === opts.maxAttempts) {
				throw lastError;
			}

			// Calculate delay with exponential backoff
			const delayMs = Math.min(opts.delay * Math.pow(opts.backoff, attempt - 1), opts.maxDelay);

			// Log retry attempt
			if (logger) {
				logger.warn(
					`Retry attempt ${attempt}/${opts.maxAttempts} after ${delayMs}ms. Error: ${lastError.message}`
				);
			}

			// Call onRetry callback if provided
			if (options.onRetry) {
				options.onRetry(lastError, attempt);
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	throw lastError!;
}

// Specific retry configuration for AI services
export const AI_SERVICE_RETRY_OPTIONS: RetryOptions = {
	maxAttempts: 3,
	delay: 2000,
	backoff: 2,
	maxDelay: 10000,
	shouldRetry: (error: Error) => {
		// Retry on network errors or rate limiting
		const message = error.message.toLowerCase();
		return (
			message.includes('network') ||
			message.includes('timeout') ||
			message.includes('rate limit') ||
			message.includes('429') ||
			message.includes('503') ||
			message.includes('502')
		);
	},
};
