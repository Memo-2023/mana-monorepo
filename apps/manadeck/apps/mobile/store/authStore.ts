import { create } from 'zustand';
import { authService } from '../services/authService';
import { tokenManager, TokenState } from '../services/tokenManager';
import type { ManaUser } from '../types/auth';

interface AuthState {
	user: ManaUser | null;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;

	initialize: () => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, username: string) => Promise<void>;
	signInWithGoogle: (idToken: string) => Promise<void>;
	signInWithApple: (identityToken: string) => Promise<void>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: (updates: {
		username?: string;
		display_name?: string;
		bio?: string;
		avatar_url?: string;
	}) => Promise<void>;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	isLoading: false,
	isInitialized: false,
	error: null,

	initialize: async () => {
		try {
			set({ isLoading: true });

			// Register callback for token refresh to update user data
			authService.onTokenRefresh = (userData) => {
				console.debug('Token refreshed, updating user data in store');
				const currentUser = get().user;
				if (currentUser) {
					set({
						user: {
							...currentUser,
							id: userData.id,
							email: userData.email,
							role: userData.role,
						},
					});
				}
			};

			// Subscribe to TokenManager state changes
			tokenManager.subscribe((state, token) => {
				console.debug(`TokenManager state changed: ${state}`);
				if (state === TokenState.EXPIRED) {
					// Token expired, clear user
					const currentUser = get().user;
					if (currentUser) {
						console.debug('Token expired, clearing user from store');
						set({ user: null });
					}
				}
			});

			// Check if user is authenticated via Mana Core
			const appToken = await authService.getAppToken();

			if (appToken && authService.isTokenValidLocally(appToken)) {
				// Token exists and is valid locally
				const user = authService.getUserFromToken(appToken);
				if (user) {
					set({
						user,
						isInitialized: true,
					});
				} else {
					set({ isInitialized: true });
				}
			} else if (appToken) {
				// Token exists but might be expired - let TokenManager handle refresh
				console.debug('Token exists but may be expired, will attempt refresh on first API call');
				set({ isInitialized: true });
			} else {
				// No token at all
				await authService.clearAuthStorage();
				set({ isInitialized: true });
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
			// Don't throw - continue with unauthenticated state
			set({ error: null, isInitialized: true, user: null });
		} finally {
			set({ isLoading: false });
		}
	},

	signIn: async (email: string, password: string) => {
		try {
			set({ isLoading: true, error: null });

			const result = await authService.signIn(email, password);

			if (!result.success) {
				throw new Error(result.error || 'Failed to sign in');
			}

			set({
				user: result.user || null,
			});
		} catch (error: any) {
			set({ error: error.message || 'Failed to sign in' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	signUp: async (email: string, password: string, username: string) => {
		try {
			set({ isLoading: true, error: null });

			const result = await authService.signUp(email, password, username);

			if (!result.success) {
				throw new Error(result.error || 'Failed to sign up');
			}

			set({
				user: result.user || null,
			});
		} catch (error: any) {
			set({ error: error.message || 'Failed to sign up' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	signInWithGoogle: async (idToken: string) => {
		try {
			set({ isLoading: true, error: null });

			const result = await authService.signInWithGoogle(idToken);

			if (!result.success) {
				throw new Error(result.error || 'Google sign-in failed');
			}

			set({
				user: result.user || null,
			});
		} catch (error: any) {
			set({ error: error.message || 'Google sign-in failed' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	signInWithApple: async (identityToken: string) => {
		try {
			set({ isLoading: true, error: null });

			const result = await authService.signInWithApple(identityToken);

			if (!result.success) {
				throw new Error(result.error || 'Apple sign-in failed');
			}

			set({
				user: result.user || null,
			});
		} catch (error: any) {
			set({ error: error.message || 'Apple sign-in failed' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	signOut: async () => {
		try {
			set({ isLoading: true, error: null });

			await authService.signOut();

			// Clear TokenManager state
			await tokenManager.clearTokens();

			set({
				user: null,
			});
		} catch (error: any) {
			set({ error: error.message || 'Failed to sign out' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	resetPassword: async (email: string) => {
		try {
			set({ isLoading: true, error: null });

			const result = await authService.resetPassword(email);

			if (!result.success) {
				throw new Error(result.error || 'Failed to send reset email');
			}
		} catch (error: any) {
			set({ error: error.message || 'Failed to send reset email' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	updateProfile: async (updates) => {
		try {
			set({ isLoading: true, error: null });

			const user = get().user;
			if (!user) throw new Error('No user logged in');

			// TODO: Implement profile update via backend API
			// For now, profiles are managed via Mana Core Auth
			console.warn('Profile update not yet implemented via backend API');

			// Update local user state with the new values
			set({
				user: {
					...user,
					...updates,
				},
			});
		} catch (error: any) {
			set({ error: error.message || 'Failed to update profile' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	clearError: () => set({ error: null }),
}));
