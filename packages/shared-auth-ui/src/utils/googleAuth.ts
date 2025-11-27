/**
 * Google Identity Services integration
 * Provides helper functions for Google Sign-In on web
 */

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
	credential: string;
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
	getNotDisplayedReason: () => string;
	isSkippedMoment: () => boolean;
	getSkippedReason: () => string;
	isDismissedMoment: () => boolean;
	getDismissedReason: () => string;
	getMomentType: () => 'display' | 'skipped' | 'dismissed';
}

interface RevocationResponse {
	successful: boolean;
	error?: string;
}

let googleClientId: string | null = null;

/**
 * Set Google Client ID for initialization
 */
export function setGoogleClientId(clientId: string) {
	googleClientId = clientId;
}

/**
 * Initialize Google Identity Services
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

	if (!googleClientId) {
		console.error('Google Client ID not configured. Call setGoogleClientId() first.');
		return;
	}

	try {
		window.google.accounts.id.initialize({
			client_id: googleClientId,
			callback: (response: CredentialResponse) => {
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
