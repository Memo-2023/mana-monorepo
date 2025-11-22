/**
 * Shared Supabase utilities for Manacore monorepo
 *
 * This package provides a unified Supabase client and common database utilities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '@manacore/shared-types';

export { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with the given configuration
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Create a Supabase admin client with service role key
 */
export function createSupabaseAdminClient(config: SupabaseConfig): SupabaseClient {
  if (!config.serviceRoleKey) {
    throw new Error('Service role key is required for admin client');
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Common database query helpers
 */
export const dbHelpers = {
  /**
   * Handle Supabase query result and return standardized response
   */
  handleQueryResult<T>(result: { data: T | null; error: any }): {
    data: T | null;
    error: { message: string; code?: string } | null;
  } {
    if (result.error) {
      return {
        data: null,
        error: {
          message: result.error.message,
          code: result.error.code,
        },
      };
    }
    return { data: result.data, error: null };
  },
};
