/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData } from '@manacore/shared-auth';

// Default URL for local development only
const DEV_AUTH_URL = 'http://localhost:3001';

// Get auth URL dynamically at runtime - fallback for SSR and client
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? DEV_AUTH_URL : '';
	}
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || DEV_AUTH_URL;
}

// Lazy initialization to avoid SSR issues with localStorage
let _authService: ReturnType<typeof initializeWebAuth>['authService'] | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

function getAuthService() {
	if (!browser) return null;
	if (!_authService) {
		const auth = initializeWebAuth({ baseUrl: getAuthUrl() });
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
				const ssoResult = await authService.trySSO();
				if (ssoResult.success) {
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

	async sendMagicLink(email: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		return authService.sendMagicLink(email);
	},

	/**
	 * Check if passkeys are available in this browser
	 */
	isPasskeyAvailable(): boolean {
		const authService = getAuthService();
		if (!authService) return false;
		return authService.isPasskeyAvailable();
	},

	/**
	 * Sign in with a passkey
	 */
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

			// Get user data from token
			const userData = await authService.getUserFromToken();
			user = userData;

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

	async enableTwoFactor(password: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.enableTwoFactor(password);
	},

	async disableTwoFactor(password: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.disableTwoFactor(password);
	},

	async verifyTwoFactor(code: string, trustDevice?: boolean) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		const result = await authService.verifyTwoFactor(code, trustDevice);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = userData;
		}
		return result;
	},

	async verifyBackupCode(code: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		const result = await authService.verifyBackupCode(code);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = userData;
		}
		return result;
	},

	async generateBackupCodes(password: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.generateBackupCodes(password);
	},

	async registerPasskey(friendlyName?: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.registerPasskey(friendlyName);
	},

	async listPasskeys() {
		const authService = getAuthService();
		if (!authService) return [];
		return authService.listPasskeys();
	},

	async deletePasskey(passkeyId: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.deletePasskey(passkeyId);
	},

	async renamePasskey(passkeyId: string, friendlyName: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available' };
		return authService.renamePasskey(passkeyId, friendlyName);
	},

	async getSecurityEvents() {
		const authService = getAuthService();
		if (!authService) return [];
		return authService.getSecurityEvents();
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

			// Mark as initialized so initialize() doesn't override
			initialized = true;
			loading = false;

			// Update token manager state to reflect valid token
			if (_tokenManager) {
				await _tokenManager.getValidToken();
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

	/**
	 * Sign up with email and password
	 * @param email User email
	 * @param password User password
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
	async forgotPassword(email: string) {
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
	 * Reset password with token
	 */
	async resetPassword(token: string, newPassword: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const result = await authService.resetPassword(token, newPassword);

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
