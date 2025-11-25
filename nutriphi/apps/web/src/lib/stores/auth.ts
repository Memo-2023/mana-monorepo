/**
 * Auth Store for Nutriphi Web
 * Manages authentication state using Mana middleware pattern
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authService, type UserData } from '$lib/services/authService';
import { tokenManager } from '$lib/services/tokenManager';

const STORAGE_KEYS = {
  APP_TOKEN: 'nutriphi_app_token',
  REFRESH_TOKEN: 'nutriphi_refresh_token',
  USER_EMAIL: 'nutriphi_user_email'
};

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  async function initialize() {
    if (!browser) return;

    try {
      const token = localStorage.getItem(STORAGE_KEYS.APP_TOKEN);

      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }

      if (authService.isTokenValidLocally(token)) {
        const userData = authService.getUserFromToken(token);
        if (userData) {
          set({ user: userData, isAuthenticated: true, isLoading: false, error: null });
          return;
        }
      }

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const result = await authService.refreshTokens(refreshToken);
          if (result.appToken && result.refreshToken) {
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

      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication'
      });
    }
  }

  async function signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    update((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const result = await authService.signIn(email, password);

      if (!result.success) {
        update((state) => ({ ...state, isLoading: false, error: result.error || 'Sign in failed' }));
        return { success: false, error: result.error };
      }

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

  async function signUp(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
    update((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const result = await authService.signUp(email, password);

      if (!result.success) {
        update((state) => ({ ...state, isLoading: false, error: result.error || 'Sign up failed' }));
        return { success: false, error: result.error };
      }

      if (result.needsVerification) {
        update((state) => ({ ...state, isLoading: false, error: null }));
        return { success: true, needsVerification: true };
      }

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

  async function signInWithGoogle(
    idToken: string
  ): Promise<{ success: boolean; error?: string }> {
    update((state) => ({ ...state, isLoading: true, error: null }));

    try {
      const result = await authService.signInWithGoogle(idToken);

      if (!result.success) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: result.error || 'Google Sign-In failed'
        }));
        return { success: false, error: result.error };
      }

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
      localStorage.removeItem(STORAGE_KEYS.APP_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);

      await tokenManager.clearTokens();

      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  }

  async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    return authService.forgotPassword(email);
  }

  if (browser) {
    initialize();
  }

  return {
    subscribe,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    forgotPassword,
    initialize
  };
}

export const auth = createAuthStore();

export const user = derived(auth, ($auth) => $auth.user);
export const isAuthenticated = derived(auth, ($auth) => $auth.isAuthenticated);
export const isLoading = derived(auth, ($auth) => $auth.isLoading);
