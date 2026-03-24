/**
 * Session expired event system
 *
 * Provides a simple pub/sub mechanism for notifying UI layers
 * when a user's session has permanently expired (token refresh failed).
 *
 * This is intentionally kept framework-agnostic so it can be consumed
 * by Svelte, React, or plain JS consumers.
 */

type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

let _sessionExpired = false;

/**
 * Subscribe to session expired events.
 * Returns an unsubscribe function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
	listeners.add(listener);

	// If session is already expired, notify immediately
	if (_sessionExpired) {
		try {
			listener();
		} catch {
			// Ignore listener errors
		}
	}

	return () => {
		listeners.delete(listener);
	};
}

/**
 * Emit a session expired event.
 * Called internally by the token manager when refresh fails permanently.
 */
export function emitSessionExpired(): void {
	if (_sessionExpired) return; // Only emit once
	_sessionExpired = true;

	listeners.forEach((listener) => {
		try {
			listener();
		} catch {
			// Ignore listener errors
		}
	});
}

/**
 * Reset the session expired state.
 * Should be called when the user logs in again.
 */
export function resetSessionExpired(): void {
	_sessionExpired = false;
}

/**
 * Check if the session is currently marked as expired.
 */
export function isSessionExpired(): boolean {
	return _sessionExpired;
}
