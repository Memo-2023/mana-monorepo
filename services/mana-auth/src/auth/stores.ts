/**
 * In-memory stores for cross-request state.
 * Used to pass redirect URLs from registration/reset requests to email handlers.
 */

const TTL = 10 * 60 * 1000; // 10 minutes

function createStore() {
	const map = new Map<string, { value: string; expires: number }>();

	return {
		set(key: string, value: string) {
			map.set(key, { value, expires: Date.now() + TTL });
		},
		get(key: string): string | undefined {
			const entry = map.get(key);
			if (!entry) return undefined;
			if (Date.now() > entry.expires) {
				map.delete(key);
				return undefined;
			}
			return entry.value;
		},
		delete(key: string) {
			map.delete(key);
		},
	};
}

/** Stores source app URL for email verification redirects */
export const sourceAppStore = createStore();

/** Stores redirect URL for password reset callbacks */
export const passwordResetRedirectStore = createStore();
