/**
 * Shared error-handling helper for mutation stores.
 *
 * Wraps an async operation with consistent error state management:
 * clears the error before the operation, captures it on failure,
 * and optionally logs / re-throws.
 */

export async function withErrorHandling<T>(
	setError: (e: string | null) => void,
	operation: () => Promise<T>,
	errorMessage: string,
	options?: { rethrow?: boolean; log?: boolean }
): Promise<T | undefined> {
	const { rethrow = true, log = true } = options ?? {};
	setError(null);
	try {
		return await operation();
	} catch (e) {
		const msg = e instanceof Error ? e.message : errorMessage;
		setError(msg);
		if (log) {
			console.error(errorMessage + ':', e);
		}
		if (rethrow) {
			throw e;
		}
		return undefined;
	}
}
