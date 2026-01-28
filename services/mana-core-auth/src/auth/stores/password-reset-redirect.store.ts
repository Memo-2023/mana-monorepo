/**
 * Password Reset Redirect Store
 *
 * Temporary in-memory store for tracking which app a user requested
 * password reset from. This allows redirecting users back to the correct
 * app's reset-password page after clicking the email link.
 *
 * TTL: 1 hour (password reset tokens are short-lived)
 */

interface ResetRedirectEntry {
	redirectUrl: string;
	expiresAt: number;
}

// In-memory store: email -> { redirectUrl, expiresAt }
const store = new Map<string, ResetRedirectEntry>();

// TTL in milliseconds (1 hour)
const TTL_MS = 60 * 60 * 1000;

// Cleanup interval (every 15 minutes)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

// Start cleanup interval
setInterval(() => {
	const now = Date.now();
	for (const [email, entry] of store.entries()) {
		if (entry.expiresAt < now) {
			store.delete(email);
		}
	}
}, CLEANUP_INTERVAL_MS);

export const passwordResetRedirectStore = {
	/**
	 * Store the redirect URL for a password reset request
	 */
	set(email: string, redirectUrl: string): void {
		const normalizedEmail = email.toLowerCase().trim();
		store.set(normalizedEmail, {
			redirectUrl,
			expiresAt: Date.now() + TTL_MS,
		});
	},

	/**
	 * Get the redirect URL for an email
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

		return entry.redirectUrl;
	},

	/**
	 * Get and remove the redirect URL for an email
	 * This is used after the user clicks the link to prevent re-use
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

		return entry.redirectUrl;
	},

	/**
	 * Clear all entries (for testing)
	 */
	clear(): void {
		store.clear();
	},
};
