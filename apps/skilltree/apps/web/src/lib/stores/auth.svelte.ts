/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData } from '@manacore/shared-auth';
import { apiClient } from '$lib/api/client';

const DEV_AUTH_URL = 'http://localhost:3001';
const DEV_BACKEND_URL = 'http://localhost:3024';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? DEV_AUTH_URL : '';
	}
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || DEV_AUTH_URL;
}

function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? DEV_BACKEND_URL : '';
	}
	return process.env.PUBLIC_BACKEND_URL || DEV_BACKEND_URL;
}

let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		const auth = initializeWebAuth({
			baseUrl: getAuthUrl(),
			backendUrl: getBackendUrl(),
		});
		_authService = auth.authService;
		_tokenManager = auth.tokenManager;
	}
	return _authService;
}

function getTokenManager() {
	if (!browser) return null;
	getAuthService();
	return _tokenManager;
}

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

				const token = await authService.getAppToken();
				if (token) {
					apiClient.setAccessToken(token);
				}
			}
			initialized = true;
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			user = null;
		} finally {
			loading = false;
		}
	},

	isPasskeyAvailable(): boolean {
		const authService = getAuthService();
		if (!authService) return false;
		return authService.isPasskeyAvailable();
	},

	async signInWithPasskey() {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const result = await authService.signInWithPasskey();

			if (!result.success) {
				return { success: false, error: result.error || 'Passkey authentication failed' };
			}

			const userData = await authService.getUserFromToken();
			user = userData;

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

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

			const userData = await authService.getUserFromToken();
			user = userData;

			const token = await authService.getAppToken();
			if (token) {
				apiClient.setAccessToken(token);
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

	async signUp(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server', needsVerification: false };
		}

		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.signUp(email, password, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Signup failed', needsVerification: false };
			}

			if (result.needsVerification) {
				return { success: true, needsVerification: true };
			}

			const signInResult = await this.signIn(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage, needsVerification: false };
		}
	},

	async signOut() {
		const authService = getAuthService();
		if (!authService) {
			user = null;
			apiClient.setAccessToken(null);
			return;
		}

		try {
			await authService.signOut();
			user = null;
			apiClient.setAccessToken(null);
		} catch (error) {
			console.error('Sign out error:', error);
			user = null;
			apiClient.setAccessToken(null);
		}
	},

	async resetPassword(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const redirectTo = browser ? window.location.origin : undefined;
			const result = await authService.forgotPassword(email, redirectTo);

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

	async getAccessToken() {
		const authService = getAuthService();
		if (!authService) {
			return null;
		}
		return await authService.getAppToken();
	},

	async getValidToken(): Promise<string | null> {
		const tokenManager = getTokenManager();
		if (!tokenManager) {
			return null;
		}
		return await tokenManager.getValidToken();
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
