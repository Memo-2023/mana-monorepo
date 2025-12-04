import { browser } from '$app/environment';
import { initializeWebAuth, type UserData } from '@manacore/shared-auth';

const MANA_AUTH_URL = 'http://localhost:3001';

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

function getTokenManager() {
	if (!browser) return null;
	if (!_tokenManager) {
		getAuthService();
	}
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
		if (!browser || initialized) return;

		loading = true;
		try {
			const authService = getAuthService();
			if (!authService) return;

			const userData = await authService.getCurrentUser();
			user = userData;
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			user = null;
		} finally {
			loading = false;
			initialized = true;
		}
	},

	async signIn(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			const result = await authService.signIn(email, password);
			if (result.success && result.user) {
				user = result.user;
				return { success: true };
			}
			return { success: false, error: result.error || 'Sign in failed' };
		} catch (error) {
			console.error('Sign in error:', error);
			return { success: false, error: 'An unexpected error occurred' };
		}
	},

	async signUp(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			const result = await authService.signUp(email, password);
			if (result.success && result.user) {
				user = result.user;
				return { success: true };
			}
			return { success: false, error: result.error || 'Sign up failed' };
		} catch (error) {
			console.error('Sign up error:', error);
			return { success: false, error: 'An unexpected error occurred' };
		}
	},

	async signOut() {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			await authService.signOut();
			user = null;
			return { success: true };
		} catch (error) {
			console.error('Sign out error:', error);
			return { success: false, error: 'Sign out failed' };
		}
	},

	async resetPassword(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth service not available' };
		}

		try {
			const result = await authService.resetPassword(email);
			return result;
		} catch (error) {
			console.error('Reset password error:', error);
			return { success: false, error: 'Password reset failed' };
		}
	},

	async getAccessToken(): Promise<string | null> {
		const tokenManager = getTokenManager();
		if (!tokenManager) return null;

		try {
			return await tokenManager.getAccessToken();
		} catch {
			return null;
		}
	},
};
