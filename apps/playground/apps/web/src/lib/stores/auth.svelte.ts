import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { initializeWebAuth, type AuthService, type UserData } from '@manacore/shared-auth';

// Default URLs for local development only
const DEV_AUTH_URL = 'http://localhost:3001';
const DEV_BACKEND_URL = 'http://localhost:3025';

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
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_LLM_URL__?: string })
			.__PUBLIC_MANA_LLM_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? DEV_BACKEND_URL : '';
	}
	return process.env.PUBLIC_MANA_LLM_URL || DEV_BACKEND_URL;
}

let user = $state<UserData | null>(null);
let loading = $state(true);
let initialized = $state(false);

let _authService: AuthService | null = null;
let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

function getAuthService(): AuthService | null {
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

export const authStore = {
	get user() {
		return user;
	},
	get loading() {
		return loading;
	},
	get initialized() {
		return initialized;
	},
	get isAuthenticated() {
		return !!user;
	},

	async initialize() {
		if (initialized || !browser) return;
		loading = true;
		try {
			const authService = getAuthService();
			if (authService) {
				const currentUser = await authService.getUserFromToken();
				user = currentUser;
			}
		} catch (error) {
			console.error('Auth initialization failed:', error);
			user = null;
		} finally {
			loading = false;
			initialized = true;
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
		if (!authService) throw new Error('Auth not initialized');
		const result = await authService.signIn(email, password);
		if (result.success) {
			const currentUser = await authService.getUserFromToken();
			user = currentUser;
		}
		return result;
	},

	async signUp(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available', needsVerification: false };
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

			// Auto sign in after successful signup
			const signInResult = await this.signIn(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage, needsVerification: false };
		}
	},

	async signOut() {
		const authService = getAuthService();
		if (authService) {
			await authService.signOut();
		}
		user = null;
		goto('/login');
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

	async getValidToken(): Promise<string | null> {
		const tokenManager = getTokenManager();
		if (!tokenManager) return null;
		return await tokenManager.getValidToken();
	},

	async resendVerificationEmail(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available' };
		}

		try {
			const sourceAppUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
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
