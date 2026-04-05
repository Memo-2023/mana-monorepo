/**
 * Svelte 5 Auth Store Factory
 *
 * Creates a reactive auth store using Svelte 5 runes.
 * Generic over user type to support app-specific user models.
 *
 * @example
 * ```ts
 * // In your app's auth store file
 * import { createAuthStore } from '@mana/shared-auth-stores';
 * import { authService } from '$lib/auth';
 * import type { AppUser } from '$lib/types';
 *
 * export const authStore = createAuthStore<AppUser>(authService);
 * ```
 */

import type { AuthServiceAdapter, AuthResult, BaseUser } from './types';

/**
 * Create a Svelte 5 runes-based auth store
 *
 * @param authService - Auth service adapter implementing the AuthServiceAdapter interface
 * @returns Reactive auth store with state and actions
 */
export function createAuthStore<TUser extends BaseUser>(authService: AuthServiceAdapter<TUser>) {
	// Reactive state using Svelte 5 runes
	let user = $state<TUser | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	return {
		// Reactive getters
		get user() {
			return user;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get isAuthenticated() {
			return !!user;
		},

		/**
		 * Initialize auth state from stored tokens/session
		 */
		async initialize() {
			loading = true;
			error = null;
			try {
				const isAuth = await authService.isAuthenticated();
				if (isAuth) {
					user = await authService.getUserFromToken();
				} else {
					user = null;
				}
			} catch (e) {
				console.error('Failed to initialize auth:', e);
				error = e instanceof Error ? e.message : 'Failed to initialize authentication';
				user = null;
			} finally {
				loading = false;
			}
		},

		/**
		 * Set user manually (useful for SSR hydration)
		 */
		setUser(newUser: TUser | null) {
			user = newUser;
			error = null;
		},

		/**
		 * Sign in with email and password
		 */
		async signIn(email: string, password: string): Promise<AuthResult<TUser>> {
			loading = true;
			error = null;
			try {
				const result = await authService.signIn(email, password);
				if (result.success) {
					user = await authService.getUserFromToken();
				} else {
					error = result.error || 'Sign in failed';
				}
				return result;
			} catch (e) {
				const errorMessage = e instanceof Error ? e.message : 'Sign in failed';
				error = errorMessage;
				return { success: false, error: errorMessage };
			} finally {
				loading = false;
			}
		},

		/**
		 * Sign up with email and password
		 */
		async signUp(email: string, password: string): Promise<AuthResult<TUser>> {
			loading = true;
			error = null;
			try {
				const result = await authService.signUp(email, password);
				if (result.success && !result.needsVerification) {
					user = await authService.getUserFromToken();
				} else if (!result.success) {
					error = result.error || 'Sign up failed';
				}
				return result;
			} catch (e) {
				const errorMessage = e instanceof Error ? e.message : 'Sign up failed';
				error = errorMessage;
				return { success: false, error: errorMessage };
			} finally {
				loading = false;
			}
		},

		/**
		 * Send password reset email
		 */
		async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
			loading = true;
			error = null;
			try {
				const result = await authService.forgotPassword(email);
				if (!result.success) {
					error = result.error || 'Password reset failed';
				}
				return result;
			} catch (e) {
				const errorMessage = e instanceof Error ? e.message : 'Password reset failed';
				error = errorMessage;
				return { success: false, error: errorMessage };
			} finally {
				loading = false;
			}
		},

		/**
		 * Sign out user
		 */
		async signOut() {
			loading = true;
			error = null;
			try {
				await authService.signOut();
				user = null;
			} catch (e) {
				console.error('Sign out failed:', e);
				error = e instanceof Error ? e.message : 'Sign out failed';
			} finally {
				loading = false;
			}
		},

		/**
		 * Check authentication status
		 */
		async checkAuth(): Promise<boolean> {
			try {
				const isAuth = await authService.isAuthenticated();
				if (!isAuth) {
					user = null;
					return false;
				}
				return true;
			} catch (e) {
				console.error('Auth check failed:', e);
				user = null;
				return false;
			}
		},

		/**
		 * Clear error state
		 */
		clearError() {
			error = null;
		},
	};
}
