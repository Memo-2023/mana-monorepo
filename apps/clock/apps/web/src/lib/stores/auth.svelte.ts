/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData } from '@manacore/shared-auth';

// Get auth URL dynamically at runtime - fallback for SSR and client
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		// Falls back to localhost for local development
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	// Server-side (SSR): use Docker internal URL for container-to-container communication
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}

// Get backend URL dynamically at runtime
function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		return injectedUrl || 'http://localhost:3017';
	}
	return process.env.PUBLIC_BACKEND_URL || 'http://localhost:3017';
}

// Lazy initialization to avoid SSR issues with localStorage
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		const auth = initializeWebAuth({
			baseUrl: getAuthUrl(),
			backendUrl: getBackendUrl(), // Enables automatic token refresh on 401 responses
		});
		_authService = auth.authService;
		_tokenManager = auth.tokenManager;
	}
	return _authService;
}

function getTokenManager() {
	if (!browser) return null;
	// Ensure auth service is initialized first
	getAuthService();
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
	 * Also tries SSO if no local tokens exist (cross-domain authentication)
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
	async signUp(email: string, password: string) {
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
	async resetPassword(email: string) {
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

	/**
	 * Get access token for API calls (raw token, no refresh)
	 * @deprecated Use getValidToken() instead for automatic refresh
	 */
	async getAccessToken() {
		const authService = getAuthService();
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
		const tokenManager = getTokenManager();
		if (!tokenManager) {
			return null;
		}
		return await tokenManager.getValidToken();
	},
};
