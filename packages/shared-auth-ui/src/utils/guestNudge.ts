/**
 * Utility functions for managing guest registration nudge state.
 * Shows a nudge after X minutes of guest usage to encourage sign-up.
 */

const SESSION_PREFIX = 'guest-nudge-session';
const DISMISSED_PREFIX = 'guest-nudge-dismissed';

/**
 * Record the start of a guest session for an app (call once on mount).
 * Only sets the timestamp if one doesn't already exist.
 */
export function startGuestSession(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	const key = `${SESSION_PREFIX}-${appId}`;
	if (!localStorage.getItem(key)) {
		localStorage.setItem(key, Date.now().toString());
	}
}

/**
 * Check if enough time has passed to show the registration nudge.
 * Returns false if already dismissed or not enough time elapsed.
 */
export function shouldShowGuestNudge(appId: string, delayMinutes = 5): boolean {
	if (typeof localStorage === 'undefined') return false;

	// Already dismissed?
	if (localStorage.getItem(`${DISMISSED_PREFIX}-${appId}`) === 'true') return false;

	// Check elapsed time
	const sessionStart = localStorage.getItem(`${SESSION_PREFIX}-${appId}`);
	if (!sessionStart) return false;

	const elapsed = Date.now() - parseInt(sessionStart, 10);
	return elapsed >= delayMinutes * 60 * 1000;
}

/**
 * Permanently dismiss the nudge for an app.
 */
export function dismissGuestNudge(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(`${DISMISSED_PREFIX}-${appId}`, 'true');
}

/**
 * Reset nudge state for an app (will show again after delay).
 */
export function resetGuestNudge(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(`${SESSION_PREFIX}-${appId}`);
	localStorage.removeItem(`${DISMISSED_PREFIX}-${appId}`);
}

/**
 * Reset nudge state for all apps.
 */
export function resetAllGuestNudges(): void {
	if (typeof localStorage === 'undefined') return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(SESSION_PREFIX) || key?.startsWith(DISMISSED_PREFIX)) {
			keysToRemove.push(key);
		}
	}
	keysToRemove.forEach((key) => localStorage.removeItem(key));
}
