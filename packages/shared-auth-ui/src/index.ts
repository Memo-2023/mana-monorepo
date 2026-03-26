// Pages
export { default as LoginPage } from './pages/LoginPage.svelte';
export { default as RegisterPage } from './pages/RegisterPage.svelte';
export { default as ForgotPasswordPage } from './pages/ForgotPasswordPage.svelte';

// Components
export { default as GuestWelcomeModal } from './components/GuestWelcomeModal.svelte';
export { default as AuthGateModal } from './components/AuthGateModal.svelte';
export { default as SessionExpiredBanner } from './components/SessionExpiredBanner.svelte';
export { default as AuthGate } from './components/AuthGate.svelte';
export { default as PasskeyManager } from './components/PasskeyManager.svelte';

// Utilities
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
export type { PasskeyManagerTranslations } from './components/PasskeyManager.svelte';
