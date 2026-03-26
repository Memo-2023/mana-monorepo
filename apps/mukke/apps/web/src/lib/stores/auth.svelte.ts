/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth } from '@manacore/shared-auth';
import type { UserData } from '@manacore/shared-auth';

// Default URLs for local development only
const DEV_AUTH_URL = 'http://localhost:3001';
const DEV_BACKEND_URL = 'http://localhost:3010';

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

// Lazy initialization to avoid SSR issues with localStorage
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

// State
let user = $state<UserData | null>(null);
let loading = $state(true);
let initialized = $state(false);

export const authStore = {
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
			let authenticated = await authService.isAuthenticated();

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

	async verifyTwoFactor(code: string, trustDevice?: boolean) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		const result = await authService.verifyTwoFactor(code, trustDevice);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = userData;
		}
		return result;
	},

	async verifyBackupCode(code: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		const result = await authService.verifyBackupCode(code);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = userData;
		}
		return result;
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
			return;
		}

		try {
			await authService.signOut();
			user = null;
		} catch (error) {
			console.error('Sign out error:', error);
			user = null;
		}
	},

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

	async resetPassword(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available on server' };
		}

		try {
			const redirectTo = browser ? window.location.origin : undefined;
			const result = await authService.forgotPassword(email, redirectTo);

			if (!result.success) {
				return { success: false, error: result.error || 'Failed to send reset email' };
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},

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

	async getValidToken(): Promise<string | null> {
		const tokenManager = getTokenManager();
		if (!tokenManager) {
			return null;
		}
		return await tokenManager.getValidToken();
	},

	async getAuthHeaders(): Promise<Record<string, string>> {
		const tokenManager = getTokenManager();
		if (!tokenManager) return {};

		const token = await tokenManager.getValidToken();
		if (token) {
			return { Authorization: `Bearer ${token}` };
		}
		return {};
	},
};
