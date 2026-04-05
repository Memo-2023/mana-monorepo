import { create } from 'zustand';
import { authService } from '../services/authService';
import type { ManaUser } from '../types/auth';

interface AuthState {
	user: ManaUser | null;
	isLoading: boolean;
	isInitialized: boolean;
	error: string | null;

	initialize: () => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, username: string) => Promise<void>;
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

			// Check if user is authenticated
			const authenticated = await authService.isAuthenticated();

			if (authenticated) {
				const appToken = await authService.getAppToken();
				if (appToken) {
					const user = authService.getUserFromToken(appToken);
					if (user) {
						set({ user, isInitialized: true });
						return;
					}
				}
			}

			set({ isInitialized: true });
		} catch (error) {
			console.error('Auth initialization error:', error);
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

			set({ user: result.user || null });
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

			set({ user: result.user || null });
		} catch (error: any) {
			set({ error: error.message || 'Failed to sign up' });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	signOut: async () => {
		try {
			set({ isLoading: true, error: null });

			await authService.signOut();

			set({ user: null });
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

			// TODO: Implement profile update via mana-auth API
			console.warn('Profile update not yet implemented via mana-auth API');

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
