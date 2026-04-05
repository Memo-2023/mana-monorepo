/**
 * Mana Auth Store Factory
 *
 * Creates a complete auth store using @mana/shared-auth.
 * Replaces the ~350 lines of duplicated auth.svelte.ts in each app
 * with a single factory call.
 *
 * @example
 * ```ts
 * // apps/todo/apps/web/src/lib/stores/auth.svelte.ts
 * import { createManaAuthStore } from '@mana/shared-auth-stores';
 *
 * export const authStore = createManaAuthStore({
 *   devBackendPort: 3031,
 * });
 * ```
 *
 * @example With post-login callback
 * ```ts
 * import { createManaAuthStore } from '@mana/shared-auth-stores';
 * import { apiClient } from '$lib/api/client';
 *
 * export const authStore = createManaAuthStore({
 *   devBackendPort: 3030,
 *   onAuthenticated: async (authService) => {
 *     const token = await authService.getAppToken();
 *     if (token) apiClient.setAccessToken(token);
 *   },
 * });
 * ```
 */

import { browser } from '$app/environment';
import { initializeWebAuth, type UserData, type AuthServiceInterface } from '@mana/shared-auth';

export interface ManaAuthStoreConfig {
	/** Dev backend port (e.g. 3031 for todo). Only used in development. */
	devBackendPort?: number;
	/** Dev auth port. Defaults to 3001. */
	devAuthPort?: number;
	/** Callback after successful authentication (sign in, SSO, 2FA). */
	onAuthenticated?: (authService: AuthServiceInterface) => void | Promise<void>;
	/** Callback after sign out. */
	onSignOut?: () => void | Promise<void>;
}

export function createManaAuthStore(config: ManaAuthStoreConfig = {}) {
	const devAuthUrl = `http://localhost:${config.devAuthPort ?? 3001}`;
	const devBackendUrl = config.devBackendPort ? `http://localhost:${config.devBackendPort}` : '';

	// URL resolution (runtime, not build-time)
	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
				.__PUBLIC_MANA_AUTH_URL__;
			if (injected) return injected;
			return import.meta.env.DEV ? devAuthUrl : '';
		}
		return process.env.PUBLIC_MANA_AUTH_URL || devAuthUrl;
	}

	function getBackendUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injected = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
				.__PUBLIC_BACKEND_URL__;
			if (injected) return injected;
			return import.meta.env.DEV ? devBackendUrl : '';
		}
		return process.env.PUBLIC_BACKEND_URL || devBackendUrl;
	}

	// Lazy init (SSR-safe)
	let _authService: AuthServiceInterface | null = null;
	let _tokenManager: ReturnType<typeof initializeWebAuth>['tokenManager'] | null = null;

	function getAuthService() {
		if (!browser) return null;
		if (!_authService) {
			const backendUrl = getBackendUrl();
			const auth = initializeWebAuth({
				baseUrl: getAuthUrl(),
				...(backendUrl ? { backendUrl } : {}),
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

	async function handleAuthenticated() {
		if (config.onAuthenticated) {
			const svc = getAuthService();
			if (svc) await config.onAuthenticated(svc);
		}
	}

	// Reactive state
	let user = $state<UserData | null>(null);
	let loading = $state(true);
	let initialized = $state(false);

	return {
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
					user = await authService.getUserFromToken();
					await handleAuthenticated();
				}
				initialized = true;
			} catch (error) {
				console.error('Failed to initialize auth:', error);
				user = null;
			} finally {
				loading = false;
			}
		},

		// 2FA
		async verifyTwoFactor(code: string, trustDevice?: boolean) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			const result = await authService.verifyTwoFactor(code, trustDevice);
			if (result.success) {
				user = await authService.getUserFromToken();
				await handleAuthenticated();
			}
			return result;
		},

		async verifyBackupCode(code: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			const result = await authService.verifyBackupCode(code);
			if (result.success) {
				user = await authService.getUserFromToken();
				await handleAuthenticated();
			}
			return result;
		},

		// Magic Link
		async sendMagicLink(email: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			return authService.sendMagicLink(email);
		},

		// Passkeys
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
				user = await authService.getUserFromToken();
				await handleAuthenticated();
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
			}
		},

		// Sign In
		async signIn(email: string, password: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			try {
				const result = await authService.signIn(email, password);
				if (!result.success) return { success: false, error: result.error || 'Login failed' };
				user = await authService.getUserFromToken();
				await handleAuthenticated();
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
			}
		},

		// Sign Up
		async signUp(email: string, password: string) {
			const authService = getAuthService();
			if (!authService)
				return { success: false, error: 'Auth not available on server', needsVerification: false };
			try {
				const sourceAppUrl = browser ? window.location.origin : undefined;
				const result = await authService.signUp(email, password, sourceAppUrl);
				if (!result.success)
					return {
						success: false,
						error: result.error || 'Signup failed',
						needsVerification: false,
					};
				if (result.needsVerification) return { success: true, needsVerification: true };
				const signInResult = await this.signIn(email, password);
				return { ...signInResult, needsVerification: false };
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
					needsVerification: false,
				};
			}
		},

		// Sign Out
		async signOut() {
			const authService = getAuthService();
			if (!authService) {
				user = null;
				return;
			}
			try {
				await authService.signOut();
				user = null;
				if (config.onSignOut) await config.onSignOut();
			} catch (error) {
				console.error('Sign out error:', error);
				user = null;
			}
		},

		// Password Reset
		async resetPassword(email: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			try {
				const redirectTo = browser ? window.location.origin : undefined;
				const result = await authService.forgotPassword(email, redirectTo);
				if (!result.success)
					return { success: false, error: result.error || 'Password reset failed' };
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
			}
		},

		async resetPasswordWithToken(token: string, newPassword: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			try {
				const result = await authService.resetPassword(token, newPassword);
				if (!result.success)
					return { success: false, error: result.error || 'Failed to reset password' };
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
			}
		},

		// Token access
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

		// Email verification
		async resendVerificationEmail(email: string) {
			const authService = getAuthService();
			if (!authService) return { success: false, error: 'Auth not available on server' };
			try {
				const sourceAppUrl = browser ? window.location.origin : undefined;
				const result = await authService.resendVerificationEmail(email, sourceAppUrl);
				if (!result.success)
					return { success: false, error: result.error || 'Failed to send verification email' };
				return { success: true };
			} catch (error) {
				return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
			}
		},
	};
}

export type ManaAuthStore = ReturnType<typeof createManaAuthStore>;
