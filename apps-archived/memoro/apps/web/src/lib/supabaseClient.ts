/**
 * Supabase client initialization for memoro-web
 * Supports both anonymous and authenticated clients
 * Matches memoro_app pattern with dual client approach
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$lib/config/env';
import { browser } from '$app/environment';
import { tokenManager } from './services/tokenManager';
import type { Database } from './types/database.types';

// Singleton instance for anonymous client
let anonClient: SupabaseClient<Database> | null = null;

// Singleton instance for authenticated client
let authClient: SupabaseClient<Database> | null = null;

// Track the current auth token to detect changes
let currentAuthToken: string | null = null;

/**
 * Get or create the anonymous Supabase client (singleton)
 * Used for public operations that don't require authentication
 */
export const supabase = (() => {
	if (!anonClient) {
		anonClient = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		});
	}
	return anonClient;
})();

/**
 * Get or create the authenticated Supabase client (singleton)
 * Reuses the same client instance unless the token changes
 * This is the primary method for authenticated operations
 */
export const createAuthClient = async (): Promise<SupabaseClient<Database>> => {
	// Only works in browser
	if (!browser) {
		return supabase;
	}

	// Get the app token (Mana JWT)
	const token = await tokenManager.getValidToken();

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
	authClient = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
		global: {
			headers: {
				Authorization: `Bearer ${token}`, // Use the Mana JWT token
			},
		},
	});

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
