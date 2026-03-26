import { browser } from '$app/environment';
import type { ManaUser } from '$lib/types/auth';
import { authService, tokenManager } from '$lib/auth';
import type { UserData } from '$lib/auth';

// Svelte 5 runes-based auth store
let user = $state<ManaUser | null>(null);
let loading = $state(true);

/**
 * Convert UserData from shared-auth to ManaUser
 */
function toManaUser(userData: UserData | null): ManaUser | null {
	if (!userData) return null;
	return {
		id: userData.id,
		email: userData.email,
		role: userData.role,
	};
}

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

	/**
	 * Initialize auth state from stored tokens
	 * Also tries SSO if no local tokens exist (cross-domain authentication)
	 */
	async initialize() {
		loading = true;
		try {
			// First, check if we have valid local tokens
			let isAuth = await authService.isAuthenticated();

			// If not authenticated locally, try SSO (shared session cookie)
			if (!isAuth) {
				console.log('No local tokens, trying SSO...');
				const ssoResult = await authService.trySSO();
				if (ssoResult.success) {
					console.log('SSO successful, user authenticated via shared session');
					isAuth = true;
				}
			}

			if (isAuth) {
				const userData = await authService.getUserFromToken();
				user = toManaUser(userData);
			}
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			user = null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Set user
	 */
	setUser(newUser: ManaUser | null) {
		user = newUser;
	},

	/**
	 * Sign out
	 */
	async signOut() {
		try {
			await authService.signOut();
			user = null;
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	},

	/**
	 * Check authentication status
	 */
	async checkAuth() {
		const isAuth = await authService.isAuthenticated();
		if (!isAuth) {
			user = null;
			return false;
		}
		return true;
	},

	async verifyTwoFactor(code: string, trustDevice?: boolean) {
		const result = await authService.verifyTwoFactor(code, trustDevice);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	async verifyBackupCode(code: string) {
		const result = await authService.verifyBackupCode(code);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	isPasskeyAvailable(): boolean {
		return authService.isPasskeyAvailable();
	},

	async signInWithPasskey() {
		const result = await authService.signInWithPasskey();
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	/**
	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string) {
		const result = await authService.signIn(email, password);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(email: string, password: string) {
		// Pass the current app URL for post-verification redirect
		const sourceAppUrl = browser ? window.location.origin : undefined;
		const result = await authService.signUp(email, password, sourceAppUrl);
		if (result.success && !result.needsVerification) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	/**
	 * Send password reset email
	 */
	async forgotPassword(email: string) {
		const redirectTo = browser ? window.location.origin : undefined;
		return authService.forgotPassword(email, redirectTo);
	},

	/**
	 * Reset password with token (from reset email link)
	 */
	async resetPasswordWithToken(token: string, newPassword: string) {
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
	 * Resend verification email
	 */
	async resendVerificationEmail(email: string) {
		const sourceAppUrl = browser ? window.location.origin : undefined;
		return authService.resendVerificationEmail(email, sourceAppUrl);
	},

	/**
	 * Get access token for API calls (raw token, no refresh)
	 * @deprecated Use getValidToken() instead for automatic refresh
	 */
	async getAccessToken(): Promise<string | null> {
		return await authService.getAppToken();
	},

	/**
	 * Get a valid access token for API calls
	 * Automatically refreshes if the token is expired or about to expire
	 */
	async getValidToken(): Promise<string | null> {
		return await tokenManager.getValidToken();
	},
};
