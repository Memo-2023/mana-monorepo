/**
 * Apple Sign-In integration for web
 * Uses redirect flow (not popup) - different from mobile native flow
 */

import { env } from '$lib/config/env';
import { browser } from '$app/environment';

// TypeScript definitions for Apple ID SDK
declare global {
	interface Window {
		AppleID?: {
			auth: {
				init: (config: AppleIDInitConfig) => void;
				signIn: () => Promise<AppleIDSignInResponse>;
			};
		};
	}
}

interface AppleIDInitConfig {
	clientId: string;
	scope: string;
	redirectURI: string;
	state?: string;
	nonce?: string;
	usePopup?: boolean;
	responseType?: string;
	responseMode?: string;
}

interface AppleIDSignInResponse {
	authorization: {
		code: string;
		id_token?: string;
		state?: string;
	};
	user?: {
		email?: string;
		name?: {
			firstName?: string;
			lastName?: string;
		};
	};
}

interface AppleAuthorizationResponse {
	code: string;
	id_token?: string;
	state?: string;
	user?: string; // JSON string of user info (only on first sign-in)
}

/**
 * Initialize Apple ID SDK
 * Must be called before using Apple Sign-In
 */
export function initializeAppleAuth() {
	if (!browser || !window.AppleID) {
		console.warn('Apple ID SDK not loaded');
		return false;
	}

	const clientId = env.oauth.appleClientId;
	// Use the handler endpoint for POST, not the page route
	const redirectURI =
		env.oauth.appleRedirectUri?.replace('/auth/apple-callback', '/auth/apple-callback-handler') ||
		'https://app.memoro.ai/auth/apple-callback-handler';

	// Log configuration for debugging (especially useful in production)
	console.log('Apple Sign-In Configuration:', {
		clientId: clientId || '❌ NOT SET',
		redirectURI: redirectURI,
		originalRedirectURI: env.oauth.appleRedirectUri || '❌ NOT SET',
		responseMode: 'form_post',
		responseType: 'code id_token',
	});

	if (!clientId) {
		console.error('❌ Apple Client ID not configured');
		console.error('Expected: PUBLIC_APPLE_CLIENT_ID=com.memoro.web');
		return false;
	}

	try {
		window.AppleID.auth.init({
			clientId,
			scope: 'name email',
			redirectURI,
			state: generateState(),
			usePopup: false, // Must use redirect on web
			responseType: 'code id_token', // Request both code and id_token
			responseMode: 'form_post', // Use form_post for secure POST to server - required for email/name scopes
		});

		console.log('✅ Apple ID SDK initialized successfully with form_post response mode');
		return true;
	} catch (error) {
		console.error('Error initializing Apple ID SDK:', error);
		return false;
	}
}

/**
 * Initiate Apple Sign-In (redirect flow)
 * Stores state and redirects to Apple
 */
export async function signInWithApple(): Promise<void> {
	if (!browser) {
		throw new Error('Apple Sign-In only available in browser');
	}

	if (!window.AppleID) {
		throw new Error('Apple ID SDK not loaded');
	}

	try {
		// Store return URL before redirect
		const returnTo = window.location.pathname + window.location.search;
		sessionStorage.setItem('apple_signin_return_to', returnTo);

		// Initiate sign-in (will redirect to Apple)
		await window.AppleID.auth.signIn();
	} catch (error) {
		console.error('Error initiating Apple Sign-In:', error);
		throw error;
	}
}

/**
 * Parse Apple authorization response from URL
 * Called by the callback page after redirect from Apple
 */
export function parseAppleAuthorizationResponse(
	urlParams: URLSearchParams
): AppleAuthorizationResponse | null {
	const code = urlParams.get('code');
	const id_token = urlParams.get('id_token');
	const state = urlParams.get('state');
	const user = urlParams.get('user');
	const error = urlParams.get('error');

	// Check for errors
	if (error) {
		console.error('Apple Sign-In error:', error);
		return null;
	}

	// Validate state (CSRF protection)
	const storedState = sessionStorage.getItem('apple_signin_state');
	if (state !== storedState) {
		console.error('State mismatch - possible CSRF attack');
		return null;
	}

	// IMPORTANT: We need either id_token OR code
	// For backend compatibility, we prefer id_token if available
	if (!id_token && !code) {
		console.error('No id_token or authorization code in Apple response');
		return null;
	}

	// Log what we received
	console.log('Apple response:', {
		hasIdToken: !!id_token,
		hasCode: !!code,
		hasState: !!state,
		hasUser: !!user,
	});

	return {
		code: code || '',
		id_token: id_token || undefined,
		state: state || undefined,
		user: user || undefined,
	};
}

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
	const state = Math.random().toString(36).substring(2, 15);
	if (browser) {
		sessionStorage.setItem('apple_signin_state', state);
	}
	return state;
}

/**
 * Get stored return URL (where to redirect after sign-in)
 */
export function getStoredReturnUrl(): string {
	if (!browser) return '/dashboard';
	return sessionStorage.getItem('apple_signin_return_to') || '/dashboard';
}

/**
 * Clear Apple Sign-In session data
 */
export function clearAppleSignInSession() {
	if (!browser) return;
	sessionStorage.removeItem('apple_signin_state');
	sessionStorage.removeItem('apple_signin_return_to');
}

/**
 * Check if Apple ID SDK is loaded
 */
export function isAppleAuthLoaded(): boolean {
	return browser && !!window.AppleID?.auth;
}

/**
 * Wait for Apple ID SDK to load
 */
export function waitForAppleAuth(timeout = 10000): Promise<void> {
	return new Promise((resolve, reject) => {
		if (isAppleAuthLoaded()) {
			resolve();
			return;
		}

		const startTime = Date.now();
		const interval = setInterval(() => {
			if (isAppleAuthLoaded()) {
				clearInterval(interval);
				resolve();
			} else if (Date.now() - startTime > timeout) {
				clearInterval(interval);
				reject(new Error('Apple ID SDK failed to load'));
			}
		}, 100);
	});
}
