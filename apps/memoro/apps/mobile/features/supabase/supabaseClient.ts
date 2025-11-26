import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Config from '~/config';
import { Database } from '~/types/supabase';
import { getToken } from '@/auth/services/tokenManager';
import { authService } from '@/auth/services/authService';

// Singleton instance for anonymous client
let anonClient: SupabaseClient<Database> | null = null;

// Singleton instance for authenticated client
let authClient: SupabaseClient<Database> | null = null;

// Track the current auth token to detect changes
let currentAuthToken: string | null = null;

/**
 * Get or create the anonymous Supabase client (singleton)
 */
export const supabase = (() => {
  if (!anonClient) {
    anonClient = createClient<Database>(
      Config.SUPABASE_URL!,
      Config.SUPABASE_ANON_KEY!, // Publishable keys work the same as anon keys
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return anonClient;
})();

/**
 * Get or create the authenticated Supabase client (singleton)
 * Reuses the same client instance unless the token changes
 */
export const createAuthClient = async (): Promise<SupabaseClient<Database>> => {
  // Get the Memoro Supabase JWT token
  const memoroJwt = await authService.getAppSupabaseToken();
  
  // Use Memoro JWT if available, otherwise fall back to regular token
  const token = memoroJwt || await getToken();
  
  // If we have a client and the token hasn't changed, reuse it
  if (authClient && currentAuthToken === token) {
    return authClient;
  }

  // Token changed or no client exists, create/update the client
  currentAuthToken = token;
  
  if (!token) {
    // No token, return anonymous client
    return supabase;
  }

  // Create authenticated client with proper JWT
  authClient = createClient<Database>(
    Config.SUPABASE_URL!,
    Config.SUPABASE_ANON_KEY!, // Use publishable key
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`, // Use the JWT token
        },
      },
    }
  );

  return authClient;
};

/**
 * Clear the authenticated client (use on logout)
 */
export const clearAuthClient = () => {
  authClient = null;
  currentAuthToken = null;
};

// Export for backward compatibility
export { supabase as supabaseClient };