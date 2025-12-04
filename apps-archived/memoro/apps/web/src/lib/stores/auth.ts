/**
 * Auth Store for memoro-web
 * Manages authentication state using Mana middleware pattern from memoro_app
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authService } from '$lib/services/authService';
import type { UserData } from '$lib/services/authService';
import { tokenManager, TokenState } from '$lib/services/tokenManager';
import { clearAuthClient } from '$lib/supabaseClient';

// Storage keys
const STORAGE_KEYS = {
	APP_TOKEN: 'memoro_app_token',
	REFRESH_TOKEN: 'memoro_refresh_token',
	USER_EMAIL: 'memoro_user_email',
};

// Auth state
interface AuthState {
	user: UserData | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

// Create writable store
function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		error: null,
	});

	// Initialize auth state from localStorage
	async function initialize() {
		if (!browser) return;

		try {
			const token = localStorage.getItem(STORAGE_KEYS.APP_TOKEN);

			if (!token) {
				set({ user: null, isAuthenticated: false, isLoading: false, error: null });
				return;
			}

			// Check if token is valid locally
			if (authService.isTokenValidLocally(token)) {
				const userData = authService.getUserFromToken(token);
				if (userData) {
					set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
					return;
				}
			}

			// Token expired, try to refresh
			const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
			if (refreshToken) {
				try {
					const result = await authService.refreshTokens(refreshToken);
					if (result.appToken && result.refreshToken) {
						// Store new tokens
						localStorage.setItem(STORAGE_KEYS.APP_TOKEN, result.appToken);
						localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);

						const userData = authService.getUserFromToken(result.appToken);
						if (userData) {
							set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
							return;
						}
					}
				} catch (error) {
					console.error('Failed to refresh token on init:', error);
				}
			}

			// Could not refresh, clear state
			set({ user: null, isAuthenticated: false, isLoading: false, error: null });
		} catch (error) {
			console.error('Error initializing auth:', error);
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: 'Failed to initialize authentication',
			});
		}
	}

	// Sign in with email and password
	async function signIn(
		email: string,
		password: string
	): Promise<{ success: boolean; error?: string }> {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const result = await authService.signIn(email, password);

			if (!result.success) {
				update((state) => ({
					...state,
					isLoading: false,
					error: result.error || 'Sign in failed',
				}));
				return { success: false, error: result.error };
			}

			// Store tokens
			if (result.appToken && result.refreshToken) {
				localStorage.setItem(STORAGE_KEYS.APP_TOKEN, result.appToken);
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
				if (result.email) {
					localStorage.setItem(STORAGE_KEYS.USER_EMAIL, result.email);
				}

				const userData = authService.getUserFromToken(result.appToken);
				if (userData) {
					set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
					return { success: true };
				}
			}

			throw new Error('Invalid auth response');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during sign in';
			update((state) => ({ ...state, isLoading: false, error: errorMessage }));
			return { success: false, error: errorMessage };
		}
	}

	// Sign up with email and password
	async function signUp(
		email: string,
		password: string
	): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const result = await authService.signUp(email, password);

			if (!result.success) {
				update((state) => ({
					...state,
					isLoading: false,
					error: result.error || 'Sign up failed',
				}));
				return { success: false, error: result.error };
			}

			// Check if email verification is required
			if (result.needsVerification) {
				update((state) => ({ ...state, isLoading: false, error: null }));
				return { success: true, needsVerification: true };
			}

			// Store tokens
			if (result.appToken && result.refreshToken) {
				localStorage.setItem(STORAGE_KEYS.APP_TOKEN, result.appToken);
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
				if (result.email) {
					localStorage.setItem(STORAGE_KEYS.USER_EMAIL, result.email);
				}

				const userData = authService.getUserFromToken(result.appToken);
				if (userData) {
					set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
					return { success: true };
				}
			}

			throw new Error('Invalid auth response');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during sign up';
			update((state) => ({ ...state, isLoading: false, error: errorMessage }));
			return { success: false, error: errorMessage };
		}
	}

	// Sign in with Google
	async function signInWithGoogle(idToken: string): Promise<{ success: boolean; error?: string }> {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const result = await authService.signInWithGoogle(idToken);

			if (!result.success) {
				update((state) => ({
					...state,
					isLoading: false,
					error: result.error || 'Google Sign-In failed',
				}));
				return { success: false, error: result.error };
			}

			// Store tokens
			if (result.appToken && result.refreshToken) {
				localStorage.setItem(STORAGE_KEYS.APP_TOKEN, result.appToken);
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
				if (result.email) {
					localStorage.setItem(STORAGE_KEYS.USER_EMAIL, result.email);
				}

				const userData = authService.getUserFromToken(result.appToken);
				if (userData) {
					set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
					return { success: true };
				}
			}

			throw new Error('Invalid auth response');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during Google Sign-In';
			update((state) => ({ ...state, isLoading: false, error: errorMessage }));
			return { success: false, error: errorMessage };
		}
	}

	// Sign in with Apple
	// Note: On web, Apple returns an authorization code (not identity token like mobile)
	// The middleware needs to exchange the code for an identity token
	async function signInWithApple(
		authorizationCode: string
	): Promise<{ success: boolean; error?: string }> {
		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			// For web, we send the authorization code
			// Middleware will need to exchange it for an identity token
			// TODO: Confirm middleware supports authorization code exchange for Apple
			const result = await authService.signInWithApple(authorizationCode);

			if (!result.success) {
				update((state) => ({
					...state,
					isLoading: false,
					error: result.error || 'Apple Sign-In failed',
				}));
				return { success: false, error: result.error };
			}

			// Store tokens
			if (result.appToken && result.refreshToken) {
				localStorage.setItem(STORAGE_KEYS.APP_TOKEN, result.appToken);
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
				if (result.email) {
					localStorage.setItem(STORAGE_KEYS.USER_EMAIL, result.email);
				}

				const userData = authService.getUserFromToken(result.appToken);
				if (userData) {
					set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
					return { success: true };
				}
			}

			throw new Error('Invalid auth response');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error during Apple Sign-In';
			update((state) => ({ ...state, isLoading: false, error: errorMessage }));
			return { success: false, error: errorMessage };
		}
	}

	// Sign out
	async function signOut(): Promise<void> {
		update((state) => ({ ...state, isLoading: true }));

		try {
			const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
			if (refreshToken) {
				await authService.signOut(refreshToken);
			}
		} catch (error) {
			console.error('Error during sign out:', error);
		} finally {
			// Clear local storage
			localStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);

			// Clear token manager
			await tokenManager.clearTokens();

			// Clear Supabase client
			clearAuthClient();

			// Reset state
			set({ user: null, isAuthenticated: false, isLoading: false, error: null });
		}
	}

	// Forgot password
	async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
		return authService.forgotPassword(email);
	}

	// Initialize on load
	if (browser) {
		initialize();
	}

	return {
		subscribe,
		signIn,
		signUp,
		signInWithGoogle,
		signInWithApple,
		signOut,
		forgotPassword,
		initialize,
	};
}

export const auth = createAuthStore();

// Derived stores for convenience
export const user = derived(auth, ($auth) => $auth.user);
export const isAuthenticated = derived(auth, ($auth) => $auth.isAuthenticated);
export const isLoading = derived(auth, ($auth) => $auth.isLoading);
