import { create } from 'zustand';
import { authService, type UserData, type AuthResult } from '../services/auth/authService';
import { tokenManager } from '../services/auth/tokenManager';

interface AuthState {
  // State
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signInWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: (idToken: string, user?: { email?: string; fullName?: { givenName?: string; familyName?: string } }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Initialize auth state from stored tokens
   */
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      const token = await tokenManager.getAppToken();

      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
        return;
      }

      // Check if token is still valid
      if (authService.isTokenValidLocally(token)) {
        const userData = authService.getUserFromToken(token);
        if (userData) {
          set({ user: userData, isAuthenticated: true, isLoading: false, isInitialized: true });
          return;
        }
      }

      // Try to refresh token
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const result = await authService.refreshTokens(refreshToken);
          if (result.appToken && result.refreshToken) {
            await tokenManager.setAppToken(result.appToken);
            await tokenManager.setRefreshToken(result.refreshToken);

            const userData = authService.getUserFromToken(result.appToken);
            if (userData) {
              set({ user: userData, isAuthenticated: true, isLoading: false, isInitialized: true });
              return;
            }
          }
        } catch (error) {
          console.error('Failed to refresh token on init:', error);
        }
      }

      // Clear invalid tokens
      await tokenManager.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Failed to initialize authentication',
      });
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.signIn(email, password);

      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Sign in failed' });
        return { success: false, error: result.error };
      }

      if (result.appToken && result.refreshToken) {
        await tokenManager.setAppToken(result.appToken);
        await tokenManager.setRefreshToken(result.refreshToken);
        if (result.email) {
          await tokenManager.setUserEmail(result.email);
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
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.signUp(email, password);

      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Sign up failed' });
        return { success: false, error: result.error };
      }

      if (result.needsVerification) {
        set({ isLoading: false, error: null });
        return { success: true, needsVerification: true };
      }

      if (result.appToken && result.refreshToken) {
        await tokenManager.setAppToken(result.appToken);
        await tokenManager.setRefreshToken(result.refreshToken);
        if (result.email) {
          await tokenManager.setUserEmail(result.email);
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
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.signInWithGoogle(idToken);

      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Google Sign-In failed' });
        return { success: false, error: result.error };
      }

      if (result.appToken && result.refreshToken) {
        await tokenManager.setAppToken(result.appToken);
        await tokenManager.setRefreshToken(result.refreshToken);
        if (result.email) {
          await tokenManager.setUserEmail(result.email);
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
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign in with Apple
   */
  signInWithApple: async (idToken: string, user?: { email?: string; fullName?: { givenName?: string; familyName?: string } }) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.signInWithApple(idToken, user);

      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Apple Sign-In failed' });
        return { success: false, error: result.error };
      }

      if (result.appToken && result.refreshToken) {
        await tokenManager.setAppToken(result.appToken);
        await tokenManager.setRefreshToken(result.refreshToken);
        if (result.email) {
          await tokenManager.setUserEmail(result.email);
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
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    set({ isLoading: true });

    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        await authService.signOut(refreshToken);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      await tokenManager.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email: string) => {
    return authService.forgotPassword(email);
  },

  /**
   * Refresh authentication tokens
   */
  refreshAuth: async () => {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const result = await authService.refreshTokens(refreshToken);
      if (result.appToken && result.refreshToken) {
        await tokenManager.setAppToken(result.appToken);
        await tokenManager.setRefreshToken(result.refreshToken);

        if (result.userData) {
          set({ user: result.userData });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));
