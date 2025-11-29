import { createClient } from '@supabase/supabase-js';
import { tokenManager, TokenState } from '../services/tokenManager';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
export const supabaseUrl =
	process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://npgifbrwhftlbrbaglmi.supabase.co';
export const supabaseAnonKey =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4';

// Store for the JWT token
let jwtToken: string | null = null;

// Store for the authenticated client (singleton)
let authClient: any = null;

// Track token state changes for automatic Supabase auth updates
let tokenStateUnsubscribe: (() => void) | null = null;

/**
 * Create the base Supabase client with anonymous credentials
 */
const supabase = createClient(
	supabaseUrl,
	supabaseAnonKey, // Publishable keys work the same as anon keys
	{
		auth: {
			...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
			autoRefreshToken: false, // Handle token refresh manually
			persistSession: false, // Handle session persistence manually
			detectSessionInUrl: false,
		},
		global: {
			headers: {
				'x-application-name': 'memoro-app',
				'User-Agent': `Memoro/${Constants.expoConfig?.version || '2.0.5'} (${Platform.OS}; ${Platform.Version})`,
				'x-client-info': 'supabase-js/2.45.0',
			},
		},
		realtime: {
			headers: {
				'x-application-name': 'memoro-app',
				'User-Agent': `Memoro/${Constants.expoConfig?.version || '2.0.5'} (${Platform.OS}; ${Platform.Version})`,
			},
			params: {
				apikey: supabaseAnonKey,
			},
		},
	}
);

/**
 * Create an authenticated Supabase client with the JWT token
 * @param token JWT token to use for authentication
 * @returns Supabase client with authentication
 */
export const createAuthClient = (token: string) => {
	return createClient(
		supabaseUrl,
		supabaseAnonKey, // Publishable keys work the same as anon keys
		{
			auth: {
				...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
				autoRefreshToken: false,
				persistSession: false,
				detectSessionInUrl: false,
			},
			global: {
				headers: {
					Authorization: `Bearer ${token}`,
					'x-application-name': 'memoro-app',
					'User-Agent': `Memoro/${Constants.expoConfig?.version || '2.0.5'} (${Platform.OS}; ${Platform.Version})`,
					'x-client-info': 'supabase-js/2.45.0',
				},
			},
			realtime: {
				headers: {
					'x-application-name': 'memoro-app',
					'User-Agent': `Memoro/${Constants.expoConfig?.version || '2.0.5'} (${Platform.OS}; ${Platform.Version})`,
				},
				params: {
					apikey: supabaseAnonKey,
				},
			},
		}
	);
};

/**
 * Update the stored JWT token and create a new authenticated client
 */
export const updateStoredToken = async (): Promise<void> => {
	try {
		// Get the JWT token from the token manager
		const token = await tokenManager.getValidToken();
		jwtToken = token;

		if (token) {
			console.debug('JWT token updated:', `${token.substring(0, 20)}...`);

			// Update Supabase headers with the new token
			setupSupabaseHeaders(token);

			// Update realtime auth with the token
			supabase.realtime.setAuth(token);

			// Debug: Try to decode the token to verify it has a sub claim
			try {
				const base64Url = token.split('.')[1];
				const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

				let payload;
				if (typeof window !== 'undefined' && window.atob) {
					payload = JSON.parse(window.atob(base64));
				} else {
					const base64js = require('base64-js');
					const uint8Array = base64js.toByteArray(base64);
					const decoded = String.fromCharCode.apply(null, uint8Array);
					payload = JSON.parse(decoded);
				}

				console.debug('JWT payload:', {
					sub: payload.sub,
					role: payload.role,
					issuer: payload.iss,
				});
			} catch (error) {
				console.debug('Error decoding JWT token:', error);
			}
		} else {
			console.debug('No JWT token available');
		}
	} catch (error) {
		console.debug('Error updating stored token:', error);
	}
};

/**
 * Add Supabase-specific headers to requests
 * Note: Token refresh is now handled by the global fetch interceptor
 */
const setupSupabaseHeaders = (token: string) => {
	// Set auth token for Supabase realtime
	if (token) {
		supabase.realtime.setAuth(token);
	}
};

// Note: Token will be initialized when explicitly needed to avoid infinite refresh loops

/**
 * Initialize automatic Supabase auth updates when token state changes
 */
export const initializeSupabaseAuth = (): void => {
	// Clean up existing listener
	if (tokenStateUnsubscribe) {
		tokenStateUnsubscribe();
	}

	// Subscribe to token state changes
	tokenStateUnsubscribe = tokenManager.subscribe((state, token) => {
		console.debug('Supabase: Token state changed to', state);

		if (state === TokenState.VALID && token) {
			// Update Supabase with new token
			updateStoredTokenFromData(token);
		} else if (state === TokenState.FAILED || state === TokenState.EXPIRED) {
			// Clear Supabase auth
			clearSupabaseAuth();
		}
	});
};

/**
 * Update Supabase auth state when token changes
 * Only updates if we actually have a valid token to avoid triggering refresh loops
 */
export const updateSupabaseAuth = async (): Promise<void> => {
	try {
		// Get current token state from TokenManager
		const currentState = tokenManager.getState();

		if (currentState === TokenState.VALID) {
			// Try to get a valid token (which will handle refresh if needed)
			const token = await tokenManager.getValidToken();
			if (token) {
				updateStoredTokenFromData(token);
			} else {
				console.debug('Skipping Supabase auth update - no valid token available');
			}
		} else {
			console.debug('Skipping Supabase auth update - token state is not valid:', currentState);
		}
	} catch (error) {
		console.debug('Error in updateSupabaseAuth:', error);
		// Don't throw - this is a non-critical operation
	}
};

/**
 * Update Supabase with a specific token
 */
const updateStoredTokenFromData = (token: string): void => {
	try {
		jwtToken = token;
		console.debug('Supabase: JWT token updated from TokenManager');

		// Update Supabase headers with the new token
		setupSupabaseHeaders(token);

		// Update realtime auth with the token
		supabase.realtime.setAuth(token);
	} catch (error) {
		console.debug('Error updating Supabase with token:', error);
	}
};

/**
 * Clear Supabase authentication
 */
const clearSupabaseAuth = (): void => {
	try {
		jwtToken = null;
		authClient = null;
		console.debug('Supabase: Auth cleared');

		// Note: We don't clear supabase.realtime.setAuth(null) as this might cause issues
		// The realtime connection will naturally fail with an invalid token
	} catch (error) {
		console.debug('Error clearing Supabase auth:', error);
	}
};

/**
 * Set auth token for Supabase
 * @param token JWT token to use for authentication
 * @returns true if token was set, false otherwise
 */
export const setSupabaseToken = async (token: string | null): Promise<boolean> => {
	if (token) {
		jwtToken = token;
		supabase.realtime.setAuth(token);
		setupSupabaseHeaders(token);
		return true;
	}
	return false;
};

/**
 * Get an authenticated client using the current JWT token
 * This is useful when you need to ensure you're using the latest token
 * Uses a singleton pattern to avoid creating multiple client instances
 */
export const getAuthenticatedClient = async () => {
	const token = await tokenManager.getValidToken();

	if (!token) {
		return supabase; // Return the base client if no token is available
	}

	// Check if we need to create a new client (token changed or no client exists)
	if (!authClient || token !== jwtToken) {
		authClient = createAuthClient(token);
		jwtToken = token;
	}

	return authClient;
};

export default supabase;
