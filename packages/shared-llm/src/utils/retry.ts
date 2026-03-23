/**
 * Fetch wrapper with exponential backoff retry for transient failures.
 *
 * Retries on: 429 (rate limit), 502, 503, 504 (server errors), network errors.
 * Does NOT retry on: 400, 401, 403, 404 (client errors).
 */

const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

export interface RetryOptions {
	maxRetries: number;
	/** Base delay in ms (doubles each retry). Default: 200 */
	baseDelay?: number;
}

export async function retryFetch(
	url: string,
	init: RequestInit,
	options: RetryOptions
): Promise<Response> {
	const { maxRetries, baseDelay = 200 } = options;
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, init);

			if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
				return response;
			}

			// Retryable status code
			lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
		} catch (error) {
			// Network error (connection refused, timeout, etc.)
			lastError = error instanceof Error ? error : new Error(String(error));
		}

		// Don't sleep after the last attempt
		if (attempt < maxRetries) {
			const delay = baseDelay * Math.pow(2, attempt);
			await sleep(delay);
		}
	}

	throw lastError ?? new Error('retryFetch exhausted all retries');
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
