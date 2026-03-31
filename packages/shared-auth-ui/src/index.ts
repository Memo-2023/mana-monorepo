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
export { default as TwoFactorSetup } from './components/TwoFactorSetup.svelte';
export { default as SecurityOnboarding } from './components/SecurityOnboarding.svelte';
export { default as ChangePassword } from './components/ChangePassword.svelte';
export { default as PasswordStrength } from './components/PasswordStrength.svelte';
export { default as AuditLog } from './components/AuditLog.svelte';
export { default as SessionManager } from './components/SessionManager.svelte';

// Utilities
export {
	shouldShowGuestWelcome,
	markGuestWelcomeSeen,
	resetGuestWelcome,
	resetAllGuestWelcome,
} from './utils/guestWelcome';
export { parseUserAgent, getDeviceType, formatUserAgent } from './utils/userAgent';

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
export type { TwoFactorSetupTranslations } from './components/TwoFactorSetup.svelte';
export type { SessionManagerTranslations } from './components/SessionManager.svelte';
