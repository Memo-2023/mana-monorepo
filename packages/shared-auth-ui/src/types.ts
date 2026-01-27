import type { Component } from 'svelte';

/**
 * Configuration for auth UI pages
 */
export interface AuthUIConfig {
	/** App name to display */
	appName: string;

	/** Logo component to render */
	logo: Component<{ size?: number; color?: string }>;

	/** Primary color (hex) */
	primaryColor: string;

	/** Primary color for dark mode (optional, defaults to primaryColor) */
	darkPrimaryColor?: string;

	/** Page background color for light mode */
	lightBackground?: string;

	/** Page background color for dark mode */
	darkBackground?: string;

	/** Redirect path after successful login (default: '/dashboard') */
	successRedirect?: string;

	/** Enable Google Sign-In */
	enableGoogle?: boolean;

	/** Enable Apple Sign-In */
	enableApple?: boolean;

	/** Google OAuth Client ID (required if enableGoogle is true) */
	googleClientId?: string;

	/** Apple OAuth Service ID (required if enableApple is true) */
	appleClientId?: string;

	/** Apple OAuth Redirect URI */
	appleRedirectUri?: string;
}

/**
 * Auth service interface expected by the UI components
 */
export interface AuthServiceInterface {
	signIn(email: string, password: string): Promise<AuthResult>;
	signUp(email: string, password: string): Promise<AuthResult>;
	signInWithGoogle?(idToken: string): Promise<AuthResult>;
	signInWithApple?(identityToken: string): Promise<AuthResult>;
	forgotPassword(email: string): Promise<AuthResult>;
}

/**
 * Result from auth operations
 */
export interface AuthResult {
	success: boolean;
	error?: string;
	needsVerification?: boolean;
}

/**
 * Translation strings for the guest welcome modal
 */
export interface GuestWelcomeTranslations {
	title: string;
	guestModeTitle: string;
	whatYouCanDo: string;
	dataWarningTitle: string;
	dataWarningText: string;
	loginButton: string;
	registerButton: string;
	helpButton: string;
	continueAsGuest: string;
	/** App-specific feature list (array of strings) */
	features?: string[];
}
