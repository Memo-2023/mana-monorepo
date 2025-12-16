/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth with runtime configuration (12-factor pattern)
 */

import { browser } from '$app/environment';
import { initializeWebAuth } from '@manacore/shared-auth';
import type { UserData } from '@manacore/shared-auth';
import { getAuthUrl, getBackendUrl } from '$lib/config/runtime';

// Lazy initialization to avoid SSR issues with localStorage
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

async function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		const authUrl = await getAuthUrl();
		const backendUrl = await getBackendUrl();
		const auth = initializeWebAuth({
			baseUrl: authUrl,
			backendUrl: backendUrl, // Enables automatic token refresh on 401 responses
		});
		_authService = auth.authService;
		_tokenManager = auth.tokenManager;
	}
	return _authService;
}

async function getTokenManager() {
	if (!browser) return null;
	// Ensure auth service is initialized first
	await getAuthService();
	return _tokenManager;
}

// State
let user = $state<UserData | null>(null);
let loading = $state(true);
let initialized = $state(false);

export const authStore = {
	// Getters
	get user() {
		return user;
	},
	get loading() {
		return loading;
	},
	get isAuthenticated() {
		return !!user;
	},
	get initialized() {
		return initialized;
	},

	/**
	 * Initialize auth state from stored tokens
	 */
	async initialize() {
		if (initialized) return;

		const authService = await getAuthService();
		if (!authService) {
			initialized = true;
			loading = false;
			return;
		}

		loading = true;
		try {
			const authenticated = await authService.isAuthenticated();
			if (authenticated) {
				const userData = await authService.getUserFromToken();
				user = userData;
			}
			initialized = true;
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			user = null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string) {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const result = await authService.signIn(email, password);

			if (!result.success) {
				return { success: false, error: result.error || 'Login failed' };
			}

			// Get user data from token
			const userData = await authService.getUserFromToken();
			user = userData;

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

	/**
	 * Sign up with email, password, and name
	 */
	async signUp(email: string, password: string, name: string) {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server', needsVerification: false };
		}

		try {
			const result = await authService.signUp(email, password, name);

			if (!result.success) {
				return { success: false, error: result.error || 'Signup failed', needsVerification: false };
			}

			// Mana Core Auth requires separate login after signup
			if (result.needsVerification) {
				return { success: true, needsVerification: true };
			}

			// Auto sign in after successful signup
			const signInResult = await this.signIn(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage, needsVerification: false };
		}
	},

	/**
	 * Sign out
	 */
	async signOut() {
		const authService = await getAuthService();
		if (!authService) {
			user = null;
			return;
		}

		try {
			await authService.signOut();
			user = null;
		} catch (error) {
			console.error('Sign out error:', error);
			// Clear user even if sign out fails
			user = null;
		}
	},

	/**
	 * Send password reset email
	 */
	async resetPassword(email: string) {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const result = await authService.forgotPassword(email);

			if (!result.success) {
				return { success: false, error: result.error || 'Password reset failed' };
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

	/**
	 * Get access token for API calls (raw token, no refresh)
	 * @deprecated Use getValidToken() instead for automatic refresh
	 */
	async getAccessToken() {
		const authService = await getAuthService();
		if (!authService) {
			return null;
		}
		return await authService.getAppToken();
	},

	/**
	 * Get a valid access token for API calls
	 * Automatically refreshes if the token is expired or about to expire
	 */
	async getValidToken(): Promise<string | null> {
		const tokenManager = await getTokenManager();
		if (!tokenManager) {
			return null;
		}
		return await tokenManager.getValidToken();
	},
};
