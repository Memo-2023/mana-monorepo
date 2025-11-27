/**
 * Apple Sign-In integration for web
 * Uses redirect flow (not popup)
 */

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

export interface AppleAuthorizationResponse {
	code: string;
	id_token?: string;
	state?: string;
	user?: string;
}

let appleClientId: string | null = null;
let appleRedirectUri: string | null = null;

/**
 * Set Apple Sign-In configuration
 */
export function setAppleConfig(clientId: string, redirectUri: string) {
	appleClientId = clientId;
	appleRedirectUri = redirectUri;
}

/**
 * Check if running in browser
 */
function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

/**
 * Initialize Apple ID SDK
 */
export function initializeAppleAuth(): boolean {
	if (!isBrowser() || !window.AppleID) {
		console.warn('Apple ID SDK not loaded');
		return false;
	}

	if (!appleClientId || !appleRedirectUri) {
		console.error('Apple Sign-In not configured. Call setAppleConfig() first.');
		return false;
	}

	try {
		window.AppleID.auth.init({
			clientId: appleClientId,
			scope: 'name email',
			redirectURI: appleRedirectUri,
			state: generateState(),
			usePopup: false,
			responseType: 'code id_token',
			responseMode: 'form_post',
		});

		console.log('Apple ID SDK initialized successfully');
		return true;
	} catch (error) {
		console.error('Error initializing Apple ID SDK:', error);
		return false;
	}
}

/**
 * Initiate Apple Sign-In (redirect flow)
 */
export async function signInWithApple(): Promise<void> {
	if (!isBrowser()) {
		throw new Error('Apple Sign-In only available in browser');
	}

	if (!window.AppleID) {
		throw new Error('Apple ID SDK not loaded');
	}

	try {
		const returnTo = window.location.pathname + window.location.search;
		sessionStorage.setItem('apple_signin_return_to', returnTo);
		await window.AppleID.auth.signIn();
	} catch (error) {
		console.error('Error initiating Apple Sign-In:', error);
		throw error;
	}
}

/**
 * Parse Apple authorization response from URL
 */
export function parseAppleAuthorizationResponse(
	urlParams: URLSearchParams
): AppleAuthorizationResponse | null {
	const code = urlParams.get('code');
	const id_token = urlParams.get('id_token');
	const state = urlParams.get('state');
	const user = urlParams.get('user');
	const error = urlParams.get('error');

	if (error) {
		console.error('Apple Sign-In error:', error);
		return null;
	}

	const storedState = sessionStorage.getItem('apple_signin_state');
	if (state !== storedState) {
		console.error('State mismatch - possible CSRF attack');
		return null;
	}

	if (!id_token && !code) {
		console.error('No id_token or authorization code in Apple response');
		return null;
	}

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
	if (isBrowser()) {
		sessionStorage.setItem('apple_signin_state', state);
	}
	return state;
}

/**
 * Get stored return URL
 */
export function getStoredReturnUrl(): string {
	if (!isBrowser()) return '/dashboard';
	return sessionStorage.getItem('apple_signin_return_to') || '/dashboard';
}

/**
 * Clear Apple Sign-In session data
 */
export function clearAppleSignInSession() {
	if (!isBrowser()) return;
	sessionStorage.removeItem('apple_signin_state');
	sessionStorage.removeItem('apple_signin_return_to');
}

/**
 * Check if Apple ID SDK is loaded
 */
export function isAppleAuthLoaded(): boolean {
	return isBrowser() && !!window.AppleID?.auth;
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
