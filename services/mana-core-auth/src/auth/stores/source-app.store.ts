/**
 * Source App Store
 *
 * Temporary in-memory store for tracking which app a user registered from.
 * This allows redirecting users back to the correct app's login page
 * after email verification.
 *
 * TTL: 24 hours (matches verification token expiry)
 */

interface SourceAppEntry {
	sourceAppUrl: string;
	expiresAt: number;
}

// In-memory store: email -> { sourceAppUrl, expiresAt }
const store = new Map<string, SourceAppEntry>();

// TTL in milliseconds (24 hours)
const TTL_MS = 24 * 60 * 60 * 1000;

// Cleanup interval (every hour)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Start cleanup interval
setInterval(() => {
	const now = Date.now();
	for (const [email, entry] of store.entries()) {
		if (entry.expiresAt < now) {
			store.delete(email);
		}
	}
}, CLEANUP_INTERVAL_MS);

export const sourceAppStore = {
	/**
	 * Store the source app URL for an email
	 */
	set(email: string, sourceAppUrl: string): void {
		const normalizedEmail = email.toLowerCase().trim();
		store.set(normalizedEmail, {
			sourceAppUrl,
			expiresAt: Date.now() + TTL_MS,
		});
	},

	/**
	 * Get the source app URL for an email
	 * Returns null if not found or expired
	 */
	get(email: string): string | null {
		const normalizedEmail = email.toLowerCase().trim();
		const entry = store.get(normalizedEmail);

		if (!entry) {
			return null;
		}

		// Check if expired
		if (entry.expiresAt < Date.now()) {
			store.delete(normalizedEmail);
			return null;
		}

		return entry.sourceAppUrl;
	},

	/**
	 * Get and remove the source app URL for an email
	 * This is used after verification to prevent re-use
	 */
	getAndDelete(email: string): string | null {
		const normalizedEmail = email.toLowerCase().trim();
		const entry = store.get(normalizedEmail);

		if (!entry) {
			return null;
		}

		store.delete(normalizedEmail);

		// Check if expired
		if (entry.expiresAt < Date.now()) {
			return null;
		}

		return entry.sourceAppUrl;
	},

	/**
	 * Remove entry for an email
	 */
	delete(email: string): void {
		const normalizedEmail = email.toLowerCase().trim();
		store.delete(normalizedEmail);
	},

	/**
	 * Clear all entries (for testing)
	 */
	clear(): void {
		store.clear();
	},
};
