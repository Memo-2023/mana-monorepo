// Pages
export { default as LoginPage } from './pages/LoginPage.svelte';
export { default as RegisterPage } from './pages/RegisterPage.svelte';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage.svelte';

// Components
export { default as GoogleSignInButton } from './components/GoogleSignInButton.svelte';
export { default as AppleSignInButton } from './components/AppleSignInButton.svelte';
export { default as GuestWelcomeModal } from './components/GuestWelcomeModal.svelte';
export { default as AuthGateModal } from './components/AuthGateModal.svelte';
export { default as SessionExpiredBanner } from './components/SessionExpiredBanner.svelte';

// Utilities
export {
	setGoogleClientId,
	initializeGoogleAuth,
	renderGoogleButton,
	isGoogleAuthLoaded,
	waitForGoogleAuth,
} from './utils/googleAuth';

export {
	setAppleConfig,
	initializeAppleAuth,
	signInWithApple,
	parseAppleAuthorizationResponse,
	getStoredReturnUrl,
	clearAppleSignInSession,
	isAppleAuthLoaded,
	waitForAppleAuth,
	type AppleAuthorizationResponse,
} from './utils/appleAuth';

export {
	shouldShowGuestWelcome,
	markGuestWelcomeSeen,
	resetGuestWelcome,
	resetAllGuestWelcome,
} from './utils/guestWelcome';

// Types
export type {
	AuthUIConfig,
	AuthServiceInterface,
	AuthResult,
	GuestWelcomeTranslations,
	AuthGateAction,
	AuthGateTranslations,
} from './types';
