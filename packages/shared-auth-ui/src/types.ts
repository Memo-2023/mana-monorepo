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
}

/**
 * Auth service interface expected by the UI components
 */
export interface AuthServiceInterface {
	signIn(email: string, password: string): Promise<AuthResult>;
	signUp(email: string, password: string): Promise<AuthResult>;
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

/**
 * Action types for the AuthGateModal
 */
export type AuthGateAction = 'save' | 'sync' | 'feature' | 'ai';

/**
 * Translation strings for the auth gate modal
 */
export interface AuthGateTranslations {
	loginButton: string;
	registerButton: string;
	laterButton: string;
	/** Function to generate migration info text */
	migrationInfo: (count: number) => string;
}

/**
 * Translation strings for the PasskeyManager
 */
export interface PasskeyManagerTranslations {
	title: string;
	noPasskeys: string;
	registerButton: string;
	renameButton: string;
	deleteButton: string;
	cancelButton: string;
	saveButton: string;
	confirmDeleteTitle: string;
	confirmDeleteMessage: string;
	created: string;
	lastUsed: string;
	never: string;
	backedUp: string;
	notBackedUp: string;
	browserNotSupported: string;
	registerNamePlaceholder: string;
	registerNameLabel: string;
	registerTitle: string;
	renamePlaceholder: string;
	errorGeneric: string;
	daysAgo: (days: number) => string;
	hoursAgo: (hours: number) => string;
	minutesAgo: (minutes: number) => string;
	justNow: string;
}

export interface TwoFactorSetupTranslations {
	title: string;
	statusEnabled: string;
	statusDisabled: string;
	enableButton: string;
	disableButton: string;
	regenerateButton: string;
	passwordLabel: string;
	passwordPlaceholder: string;
	confirmButton: string;
	cancelButton: string;
	setupTitle: string;
	setupStep1: string;
	setupStep2: string;
	manualEntryLabel: string;
	copyButton: string;
	copiedButton: string;
	doneButton: string;
	disableConfirmTitle: string;
	disableConfirmText: string;
	backupCodesTitle: string;
	backupCodesWarning: string;
	copyCodesButton: string;
	copiedCodesButton: string;
}

export interface SessionManagerTranslations {
	title?: string;
	subtitle?: string;
	current?: string;
	revoke?: string;
	revokeAll?: string;
	lastActivity?: string;
	confirmRevoke?: string;
	confirmRevokeAll?: string;
	noSessions?: string;
	unknown?: string;
	refresh?: string;
	revokeError?: string;
	revokeAllError?: string;
	justNow?: string;
	minutesAgo?: string;
	hoursAgo?: string;
	yesterday?: string;
	daysAgo?: string;
}
