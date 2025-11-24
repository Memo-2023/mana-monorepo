import type { StorytellerUser } from '$lib/types/auth';
import { authService, type UserData } from '$lib/auth';

// Svelte 5 runes-based auth store
let user = $state<StorytellerUser | null>(null);
let loading = $state(true);

/**
 * Convert UserData from shared-auth to StorytellerUser
 */
function toStorytellerUser(userData: UserData | null): StorytellerUser | null {
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
   */
  async initialize() {
    loading = true;
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getUserFromToken();
        user = toStorytellerUser(userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      user = null;
    } finally {
      loading = false;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const result = await authService.signIn(email, password);
    if (result.success) {
      const userData = await authService.getUserFromToken();
      user = toStorytellerUser(userData);
    }
    return result;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const result = await authService.signUp(email, password);
    if (result.success && !result.needsVerification) {
      const userData = await authService.getUserFromToken();
      user = toStorytellerUser(userData);
    }
    return result;
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle(idToken: string) {
    const result = await authService.signInWithGoogle(idToken);
    if (result.success) {
      const userData = await authService.getUserFromToken();
      user = toStorytellerUser(userData);
    }
    return result;
  },

  /**
   * Sign in with Apple
   */
  async signInWithApple(identityToken: string) {
    const result = await authService.signInWithApple(identityToken);
    if (result.success) {
      const userData = await authService.getUserFromToken();
      user = toStorytellerUser(userData);
    }
    return result;
  },

  /**
   * Set user
   */
  setUser(newUser: StorytellerUser | null) {
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
   * Send password reset email
   */
  async forgotPassword(email: string) {
    return authService.forgotPassword(email);
  },

  /**
   * Get user credits
   */
  async getCredits() {
    return authService.getUserCredits();
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
};
