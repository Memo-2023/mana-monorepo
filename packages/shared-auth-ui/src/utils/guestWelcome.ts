/**
 * Utility functions for managing guest welcome modal state
 */

const STORAGE_PREFIX = 'guest-welcome-seen';

/**
 * Check if the guest welcome modal should be shown for an app
 * @param appId The app identifier (e.g., 'contacts', 'chat')
 * @returns true if the modal should be shown (not seen before)
 */
export function shouldShowGuestWelcome(appId: string): boolean {
	if (typeof localStorage === 'undefined') return false;
	const key = `${STORAGE_PREFIX}-${appId}`;
	return localStorage.getItem(key) !== 'true';
}

/**
 * Mark the guest welcome modal as seen for an app
 * @param appId The app identifier
 */
export function markGuestWelcomeSeen(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	const key = `${STORAGE_PREFIX}-${appId}`;
	localStorage.setItem(key, 'true');
}

/**
 * Reset the guest welcome modal state for an app (will show again)
 * @param appId The app identifier
 */
export function resetGuestWelcome(appId: string): void {
	if (typeof localStorage === 'undefined') return;
	const key = `${STORAGE_PREFIX}-${appId}`;
	localStorage.removeItem(key);
}

/**
 * Reset the guest welcome modal state for all apps
 */
export function resetAllGuestWelcome(): void {
	if (typeof localStorage === 'undefined') return;
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_PREFIX)) {
			keysToRemove.push(key);
		}
	}
	keysToRemove.forEach((key) => localStorage.removeItem(key));
}
