import { createUserSettingsStore } from '@mana/shared-theme';
import { browser } from '$app/environment';

const AUTH_URL = import.meta.env.VITE_MANA_AUTH_URL || 'https://auth.mana.how';
const TOKEN_STORAGE_KEY = 'mana_core_access_token';

// Internal access token state
let accessToken: string | null = null;

/**
 * Set the access token (called after SSO token exchange)
 */
export function setAccessToken(token: string): void {
	accessToken = token;
	if (browser) {
		try {
			localStorage.setItem(TOKEN_STORAGE_KEY, token);
		} catch {
			// Ignore storage errors
		}
	}
}

/**
 * Clear the access token (called on logout)
 */
export function clearAccessToken(): void {
	accessToken = null;
	if (browser) {
		try {
			localStorage.removeItem(TOKEN_STORAGE_KEY);
		} catch {
			// Ignore storage errors
		}
	}
}

/**
 * Load access token from localStorage (for page reloads)
 */
export function loadStoredAccessToken(): string | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
		if (stored) {
			accessToken = stored;
			return stored;
		}
	} catch {
		// Ignore storage errors
	}
	return null;
}

/**
 * Get the current access token
 */
async function getAccessToken(): Promise<string | null> {
	// If we have a token in memory, return it
	if (accessToken) return accessToken;

	// Try to load from storage
	return loadStoredAccessToken();
}

/**
 * User settings store for the Matrix app
 *
 * This store syncs settings with mana-auth and provides:
 * - Global settings (including recentEmojis)
 * - localStorage caching for offline support
 */
export const userSettings = createUserSettingsStore({
	appId: 'matrix',
	authUrl: AUTH_URL,
	getAccessToken,
});
