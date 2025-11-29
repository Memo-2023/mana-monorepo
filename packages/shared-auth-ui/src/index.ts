// Pages
export { default as LoginPage } from './pages/LoginPage.svelte';
export { default as RegisterPage } from './pages/RegisterPage.svelte';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage.svelte';

// Components
export { default as GoogleSignInButton } from './components/GoogleSignInButton.svelte';
export { default as AppleSignInButton } from './components/AppleSignInButton.svelte';

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

// Types
export type { AuthUIConfig, AuthServiceInterface, AuthResult } from './types';

// Page Translation Types
export type { LoginTranslations } from './pages/LoginPage.svelte';
export type { RegisterTranslations } from './pages/RegisterPage.svelte';
export type { ForgotPasswordTranslations } from './pages/ForgotPasswordPage.svelte';
