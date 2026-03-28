/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Uses Mana Core Auth
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData, type AuthServiceInterface } from '@manacore/shared-auth';

const DEV_AUTH_URL = 'http://localhost:3001';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? DEV_AUTH_URL : '';
	}
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || DEV_AUTH_URL;
}

let _authService: AuthServiceInterface | null = null;
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
				if (ssoResult.success) authenticated = true;
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

	async signIn(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		try {
			const result = await authService.signIn(email, password);
			if (!result.success) return { success: false, error: result.error || 'Login failed' };
			const userData = await authService.getUserFromToken();
			user = userData;
			return { success: true };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	},

	async signUp(email: string, password: string) {
		const authService = getAuthService();
		if (!authService)
			return { success: false, error: 'Auth not available on server', needsVerification: false };
		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.signUp(email, password, sourceAppUrl);
			if (!result.success)
				return { success: false, error: result.error || 'Signup failed', needsVerification: false };
			if (result.needsVerification) return { success: true, needsVerification: true };
			const signInResult = await authStore.signIn(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				needsVerification: false,
			};
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
		} catch (error) {
			console.error('Sign out error:', error);
		}
		user = null;
	},

	async resetPassword(email: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		try {
			const redirectTo = browser ? window.location.origin : undefined;
			const result = await authService.forgotPassword(email, redirectTo);
			return result.success
				? { success: true }
				: { success: false, error: result.error || 'Password reset failed' };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	},

	async resetPasswordWithToken(token: string, newPassword: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		try {
			const result = await authService.resetPassword(token, newPassword);
			return result.success
				? { success: true }
				: { success: false, error: result.error || 'Failed to reset password' };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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

	async sendMagicLink(email: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		return authService.sendMagicLink(email);
	},

	isPasskeyAvailable(): boolean {
		const authService = getAuthService();
		if (!authService) return false;
		return authService.isPasskeyAvailable();
	},

	async signInWithPasskey() {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		try {
			const result = await authService.signInWithPasskey();
			if (!result.success)
				return { success: false, error: result.error || 'Passkey authentication failed' };
			const userData = await authService.getUserFromToken();
			user = userData;
			return { success: true };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	},

	async getAccessToken() {
		const authService = getAuthService();
		if (!authService) return null;
		return await authService.getAppToken();
	},

	async getValidToken(): Promise<string | null> {
		const tokenManager = getTokenManager();
		if (!tokenManager) return null;
		return await tokenManager.getValidToken();
	},

	async resendVerificationEmail(email: string) {
		const authService = getAuthService();
		if (!authService) return { success: false, error: 'Auth not available on server' };
		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.resendVerificationEmail(email, sourceAppUrl);
			return result.success
				? { success: true }
				: { success: false, error: result.error || 'Failed to resend verification email' };
		} catch (error) {
			return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
		}
	},
};
