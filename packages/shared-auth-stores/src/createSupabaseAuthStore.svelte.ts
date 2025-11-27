/**
 * Supabase Auth Store Factory
 *
 * Creates a reactive auth store that works directly with Supabase client.
 * Useful for apps that use Supabase directly without middleware.
 *
 * @example
 * ```ts
 * import { createSupabaseAuthStore } from '@manacore/shared-auth-stores';
 * import { createBrowserClient } from '@supabase/ssr';
 *
 * const supabase = createBrowserClient(url, key);
 * export const authStore = createSupabaseAuthStore(supabase);
 * ```
 */

import type { BaseUser, AuthResult } from './types';

/**
 * Minimal Supabase client interface
 * Only requires the auth methods we use
 */
interface SupabaseClientLike {
	auth: {
		getSession(): Promise<{ data: { session: { user: { id: string; email?: string } } | null } }>;
		signInWithPassword(credentials: {
			email: string;
			password: string;
		}): Promise<{ error: { message: string } | null }>;
		signUp(credentials: {
			email: string;
			password: string;
		}): Promise<{ data: { session: unknown }; error: { message: string } | null }>;
		resetPasswordForEmail(
			email: string,
			options?: { redirectTo?: string }
		): Promise<{ error: { message: string } | null }>;
		signOut(): Promise<{ error: { message: string } | null }>;
	};
}

/**
 * Options for creating a Supabase auth store
 */
export interface CreateSupabaseAuthStoreOptions {
	/** URL to redirect to after password reset */
	passwordResetRedirectUrl?: string;
}

/**
 * Default user type for Supabase auth
 */
export interface SupabaseUser extends BaseUser {
	id: string;
	email: string;
}

/**
 * Create a Svelte 5 runes-based auth store for Supabase
 *
 * @param getSupabaseClient - Function that returns a Supabase client
 * @param options - Configuration options
 * @returns Reactive auth store with state and actions
 */
export function createSupabaseAuthStore(
	getSupabaseClient: () => SupabaseClientLike,
	options: CreateSupabaseAuthStoreOptions = {}
) {
	// Reactive state using Svelte 5 runes
	let user = $state<SupabaseUser | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Get user from current session
	 */
	async function getUserFromSession(): Promise<SupabaseUser | null> {
		const supabase = getSupabaseClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session?.user) return null;
		return {
			id: session.user.id,
			email: session.user.email || '',
		};
	}

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
		 * Initialize auth state from Supabase session
		 */
		async initialize() {
			loading = true;
			error = null;
			try {
				user = await getUserFromSession();
			} catch (e) {
				console.error('Failed to initialize auth:', e);
				error = e instanceof Error ? e.message : 'Failed to initialize authentication';
				user = null;
			} finally {
				loading = false;
			}
		},

		/**
		 * Set user manually
		 */
		setUser(newUser: SupabaseUser | null) {
			user = newUser;
			error = null;
		},

		/**
		 * Sign in with email and password
		 */
		async signIn(email: string, password: string): Promise<AuthResult<SupabaseUser>> {
			loading = true;
			error = null;
			try {
				const supabase = getSupabaseClient();
				const { error: authError } = await supabase.auth.signInWithPassword({
					email,
					password,
				});

				if (authError) {
					error = authError.message;
					return { success: false, error: authError.message };
				}

				user = await getUserFromSession();
				return { success: true, user: user || undefined };
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
		async signUp(email: string, password: string): Promise<AuthResult<SupabaseUser>> {
			loading = true;
			error = null;
			try {
				const supabase = getSupabaseClient();
				const { data, error: authError } = await supabase.auth.signUp({
					email,
					password,
				});

				if (authError) {
					error = authError.message;
					return { success: false, error: authError.message };
				}

				// Check if email confirmation is required
				const needsVerification = !data.session;

				if (!needsVerification) {
					user = await getUserFromSession();
				}

				return {
					success: true,
					needsVerification,
					user: user || undefined,
				};
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
				const supabase = getSupabaseClient();
				const redirectTo =
					options.passwordResetRedirectUrl || `${window.location.origin}/reset-password`;

				const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo,
				});

				if (authError) {
					error = authError.message;
					return { success: false, error: authError.message };
				}

				return { success: true };
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
				const supabase = getSupabaseClient();
				await supabase.auth.signOut();
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
				const sessionUser = await getUserFromSession();
				if (!sessionUser) {
					user = null;
					return false;
				}
				user = sessionUser;
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
