/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth } from '@manacore/shared-auth';
import type { UserData } from '@manacore/shared-auth';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

// Initialize Mana Core Auth only on the client side
const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

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

export const auth = {
	// Getters
	get user() {
		return user;
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

	/**
	 * Initialize auth state from stored tokens
	 * Also tries SSO if no local tokens exist (cross-domain authentication)
	 */
	async init() {
		if (initialized) return;

		const authService = getAuthService();
		if (!authService) {
			initialized = true;
			loading = false;
			return;
		}

		loading = true;
		try {
			// First, check if we have valid local tokens
			let authenticated = await authService.isAuthenticated();

			// If not authenticated locally, try SSO (shared session cookie)
			if (!authenticated) {
				console.log('No local tokens, trying SSO...');
				const ssoResult = await authService.trySSO();
				if (ssoResult.success) {
					console.log('SSO successful, user authenticated via shared session');
					authenticated = true;
				}
			}

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
	 * Returns AuthResult compatible format for shared-auth-ui
	 */
	async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
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
	async register(
		email: string,
		password: string
	): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server', needsVerification: false };
		}

		try {
			// Pass the current app URL for post-verification redirect
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.signUp(email, password, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Signup failed', needsVerification: false };
			}

			// Mana Core Auth requires separate login after signup
			if (result.needsVerification) {
				return { success: true, needsVerification: true };
			}

			// Auto sign in after successful signup
			const signInResult = await this.login(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage, needsVerification: false };
		}
	},

	/**
	 * Sign out
	 */
	async logout() {
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
	async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
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
	 * Reset password with token (from reset email link)
	 */
	async resetPasswordWithToken(token: string, newPassword: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const result = await authService.resetPassword(token, newPassword);
			if (!result.success) {
				return { success: false, error: result.error || 'Failed to reset password' };
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

	/**
	 * Resend verification email
	 */
	async resendVerificationEmail(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.resendVerificationEmail(email, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Failed to resend verification email' };
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},
};
