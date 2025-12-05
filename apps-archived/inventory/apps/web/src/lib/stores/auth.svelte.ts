/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData } from '@manacore/shared-auth';

// Initialize Mana Core Auth only on the client side
const MANA_AUTH_URL = import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Lazy initialization to avoid SSR issues with localStorage
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		const auth = initializeWebAuth({ baseUrl: MANA_AUTH_URL });
		_authService = auth.authService;
		_tokenManager = auth.tokenManager;
	}
	return _authService;
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
	get isLoading() {
		return loading;
	},
	get isAuthenticated() {
		return !!user;
	},
	get initialized() {
		return initialized;
	},
	get error() {
		return null; // For compatibility
	},

	/**
	 * Initialize auth state from stored tokens
	 */
	async initialize() {
		if (initialized) return;

		const authService = getAuthService();
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
		const authService = getAuthService();
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
	 * Sign up with email and password
	 */
	async register(email: string, password: string, _name?: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server', needsVerification: false };
		}

		try {
			// Note: name is not supported by Mana Core Auth signUp
			const result = await authService.signUp(email, password);

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
		const authService = getAuthService();
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
	async requestPasswordReset(email: string) {
		const authService = getAuthService();
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
	 * Get access token for API calls
	 */
	async getAccessToken() {
		const authService = getAuthService();
		if (!authService) {
			return null;
		}
		return await authService.getAppToken();
	},
};
