/**
 * Token Manager - wraps @mana/shared-auth TokenManager
 * Maintains backward-compatible API for existing consumers
 */

import { _sharedTokenManager } from './authService';
export { TokenState } from '@mana/shared-auth';

type TokenStateObserver = (state: string, token?: string | null) => void;

export const tokenManager = {
	/**
	 * Get a valid access token, automatically refreshing if needed
	 */
	getValidToken: (): Promise<string | null> => {
		return _sharedTokenManager.getValidToken();
	},

	/**
	 * Subscribe to token state changes
	 */
	subscribe: (callback: TokenStateObserver) => {
		return _sharedTokenManager.subscribe(callback);
	},

	/**
	 * Clear all tokens (triggers sign-out)
	 */
	clearTokens: async (): Promise<void> => {
		const { authService } = await import('./authService');
		await authService.signOut();
	},

	/**
	 * Handle a 401 response by refreshing the token and retrying the request
	 */
	handle401Response: async (
		input: string | URL | Request,
		init?: RequestInit
	): Promise<Response> => {
		const token = await _sharedTokenManager.getValidToken();
		if (!token) {
			throw new Error('Session expired. Please sign in again.');
		}

		const headers = new Headers(init?.headers);
		headers.set('Authorization', `Bearer ${token}`);

		return fetch(input, { ...init, headers });
	},
};
