/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Now using Mana Core Auth instead of Supabase Auth
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

const MANA_AUTH_URL = env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
const BACKEND_URL = env.PUBLIC_BACKEND_URL || 'http://localhost:3006';

export interface UserData {
	id: string;
	email: string;
	role?: string;
}

interface AuthResult {
	success: boolean;
	error?: string;
}

// Internal auth service reference
let _authService: any = null;
let _tokenManager: any = null;

async function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		try {
			const { initializeWebAuth } = await import('@manacore/shared-auth');
			const auth = initializeWebAuth({
				baseUrl: MANA_AUTH_URL,
				backendUrl: BACKEND_URL, // Enables automatic token refresh on 401 responses
			});
			_authService = auth.authService;
			_tokenManager = auth.tokenManager;
		} catch (error) {
			console.error('Failed to initialize auth service:', error);
			return null;
		}
	}
	return _authService;
}

async function getTokenManager() {
	if (!browser) return null;
	// Ensure auth service is initialized first
	await getAuthService();
	return _tokenManager;
}

// State using Svelte 5 runes
let user = $state<UserData | null>(null);
let loading = $state(true);
let initialized = $state(false);

export const authStore = {
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

	async initialize() {
		if (!browser || initialized) return;

		loading = true;

		try {
			const authService = await getAuthService();
			if (authService) {
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
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
			user = null;
		} finally {
			loading = false;
			initialized = true;
		}
	},

	async signIn(email: string, password: string): Promise<AuthResult> {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			loading = true;
			const result = await authService.signIn(email, password);

			if (result.success) {
				const userData = await authService.getUserFromToken();
				user = userData;
				return { success: true };
			}

			return { success: false, error: result.error || 'Login failed' };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Login failed',
			};
		} finally {
			loading = false;
		}
	},

	async signUp(email: string, password: string): Promise<AuthResult> {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			loading = true;
			// Pass the current app URL for post-verification redirect
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.signUp(email, password, sourceAppUrl);

			if (result.success) {
				// Auto-login after signup
				const signInResult = await this.signIn(email, password);
				return signInResult;
			}

			return { success: false, error: result.error || 'Signup failed' };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Signup failed',
			};
		} finally {
			loading = false;
		}
	},

	async signOut(): Promise<void> {
		const authService = await getAuthService();
		if (authService) {
			try {
				await authService.signOut();
			} catch (error) {
				console.error('Sign out error:', error);
			}
		}
		user = null;
	},

	async resetPassword(email: string): Promise<AuthResult> {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			const result = await authService.forgotPassword(email);
			return {
				success: result.success,
				error: result.error,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Password reset failed',
			};
		}
	},

	/**
	 * Get access token for API calls (raw token, no refresh)
	 * @deprecated Use getValidToken() instead for automatic refresh
	 */
	async getAccessToken(): Promise<string | null> {
		const authService = await getAuthService();
		if (!authService) return null;
		return authService.getAppToken();
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

	/**
	 * Resend verification email
	 */
	async resendVerificationEmail(email: string) {
		const authService = await getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.resendVerificationEmail(email, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Failed to resend verification email' };
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to resend verification email',
			};
		}
	},

	// For compatibility with old code that reads user store directly
	setUser(userData: UserData | null) {
		user = userData;
	},
};

// Export individual reactive getters for backward compatibility
export function getUser() {
	return user;
}

export function getLoading() {
	return loading;
}

export function getIsAuthenticated() {
	return !!user;
}
