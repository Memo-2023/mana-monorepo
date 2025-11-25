/**
 * Auth Store - Manages authentication state using Svelte 5 runes
 * Compatible with Chat mobile app (same Supabase instance)
 */

import { createSupabaseBrowserClient } from '$lib/services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// State
let session = $state<Session | null>(null);
let user = $state<User | null>(null);
let loading = $state(true);
let initialized = $state(false);

// Create browser client
let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createSupabaseBrowserClient();
  }
  return supabase;
}

export const authStore = {
  // Getters
  get session() {
    return session;
  },
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

  /**
   * Initialize auth state from Supabase session
   */
  async initialize() {
    if (initialized) return;

    loading = true;
    try {
      const sb = getSupabase();

      // Get current session
      const {
        data: { session: currentSession },
      } = await sb.auth.getSession();

      session = currentSession;
      user = currentSession?.user ?? null;

      // Subscribe to auth changes
      sb.auth.onAuthStateChange((_event, newSession) => {
        session = newSession;
        user = newSession?.user ?? null;
      });

      initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      session = null;
      user = null;
    } finally {
      loading = false;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    session = data.session;
    user = data.user;
    return { success: true, error: null };
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          email_confirmed: true,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message, needsVerification: false };
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { success: true, error: null, needsVerification: true };
    }

    session = data.session;
    user = data.user;
    return { success: true, error: null, needsVerification: false };
  },

  /**
   * Sign out
   */
  async signOut() {
    const sb = getSupabase();
    await sb.auth.signOut();
    session = null;
    user = null;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const sb = getSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  },

  /**
   * Set session from server-side data
   */
  setSession(newSession: Session | null) {
    session = newSession;
    user = newSession?.user ?? null;
    initialized = true;
    loading = false;
  },
};
