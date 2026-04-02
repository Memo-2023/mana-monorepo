/**
 * Google Identity Services integration
 * Provides helper functions for Google Sign-In on web
 */

import { env } from '$lib/config/env';

// TypeScript definitions for Google Identity Services
declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: GoogleIdConfiguration) => void;
					prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
					renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
					disableAutoSelect: () => void;
					storeCredential: (credential: { id: string; password: string }) => void;
					cancel: () => void;
					onGoogleLibraryLoad: () => void;
					revoke: (hint: string, callback: (done: RevocationResponse) => void) => void;
				};
			};
		};
	}
}

interface GoogleIdConfiguration {
	client_id: string;
	callback: (response: CredentialResponse) => void;
	auto_select?: boolean;
	cancel_on_tap_outside?: boolean;
	context?: 'signin' | 'signup' | 'use';
	ux_mode?: 'popup' | 'redirect';
	login_uri?: string;
	native_callback?: (response: { id: string; password: string }) => void;
	itp_support?: boolean;
}

interface CredentialResponse {
	credential: string; // JWT ID token
	select_by: string;
	clientId?: string;
}

interface GsiButtonConfiguration {
	type?: 'standard' | 'icon';
	theme?: 'outline' | 'filled_blue' | 'filled_black';
	size?: 'large' | 'medium' | 'small';
	text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
	shape?: 'rectangular' | 'pill' | 'circle' | 'square';
	logo_alignment?: 'left' | 'center';
	width?: string;
	locale?: string;
}

interface PromptMomentNotification {
	isDisplayMoment: () => boolean;
	isDisplayed: () => boolean;
	isNotDisplayed: () => boolean;
	getNotDisplayedReason: () =>
		| 'browser_not_supported'
		| 'invalid_client'
		| 'missing_client_id'
		| 'opt_out_or_no_session'
		| 'secure_http_required'
		| 'suppressed_by_user'
		| 'unregistered_origin'
		| 'unknown_reason';
	isSkippedMoment: () => boolean;
	getSkippedReason: () =>
		| 'auto_cancel'
		| 'user_cancel'
		| 'tap_outside'
		| 'issuing_failed'
		| 'unknown_reason';
	isDismissedMoment: () => boolean;
	getDismissedReason: () =>
		| 'credential_returned'
		| 'cancel_called'
		| 'flow_restarted'
		| 'unknown_reason';
	getMomentType: () => 'display' | 'skipped' | 'dismissed';
}

interface RevocationResponse {
	successful: boolean;
	error?: string;
}

/**
 * Initialize Google Identity Services
 * @param callback Function to call when user signs in with Google
 */
export function initializeGoogleAuth(callback: (idToken: string) => void) {
	if (typeof window === 'undefined') {
		console.warn('Google Auth: Cannot initialize on server-side');
		return;
	}

	if (!window.google) {
		console.warn('Google Identity Services not loaded yet');
		return;
	}

	const clientId = env.oauth.googleClientId;
	if (!clientId) {
		console.error('Google Client ID not configured');
		return;
	}

	try {
		window.google.accounts.id.initialize({
			client_id: clientId,
			callback: (response: CredentialResponse) => {
				// response.credential is the JWT ID token
				callback(response.credential);
			},
			auto_select: false,
			cancel_on_tap_outside: true,
			ux_mode: 'popup',
		});
	} catch (error) {
		console.error('Error initializing Google Auth:', error);
	}
}

/**
 * Render Google Sign-In button
 * @param element HTML element to render button into
 * @param options Button configuration options
 */
export function renderGoogleButton(
	element: HTMLElement,
	options?: Partial<GsiButtonConfiguration>
) {
	if (typeof window === 'undefined' || !window.google) {
		console.warn('Google Identity Services not available');
		return;
	}

	const defaultOptions: GsiButtonConfiguration = {
		type: 'standard',
		theme: 'outline',
		size: 'large',
		text: 'signin_with',
		shape: 'rectangular',
		logo_alignment: 'left',
		// Note: width is omitted - Google button will auto-size to container
	};

	try {
		window.google.accounts.id.renderButton(element, {
			...defaultOptions,
			...options,
		});
	} catch (error) {
		console.error('Error rendering Google button:', error);
	}
}

/**
 * Check if Google Identity Services is loaded
 */
export function isGoogleAuthLoaded(): boolean {
	return typeof window !== 'undefined' && !!window.google?.accounts?.id;
}

/**
 * Wait for Google Identity Services to load
 * @param timeout Maximum time to wait in milliseconds (default: 10000ms)
 */
export function waitForGoogleAuth(timeout = 10000): Promise<void> {
	return new Promise((resolve, reject) => {
		if (isGoogleAuthLoaded()) {
			resolve();
			return;
		}

		const startTime = Date.now();
		const interval = setInterval(() => {
			if (isGoogleAuthLoaded()) {
				clearInterval(interval);
				resolve();
			} else if (Date.now() - startTime > timeout) {
				clearInterval(interval);
				reject(new Error('Google Identity Services failed to load'));
			}
		}, 100);
	});
}
