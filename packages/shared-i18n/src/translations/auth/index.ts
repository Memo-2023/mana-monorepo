/**
 * Auth translations exports
 */

import en from './en.json';
import de from './de.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';

export { en, de, it, fr, es };

/**
 * Auth translations type structure
 */
export interface AuthTranslations {
	login: {
		title: string;
		subtitle: string;
		emailPlaceholder: string;
		passwordPlaceholder: string;
		rememberMe: string;
		forgotPassword: string;
		signInButton: string;
		signingIn: string;
		success: string;
		orDivider: string;
		noAccount: string;
		createAccount: string;
		skipToForm: string;
		showPassword: string;
		hidePassword: string;
		emailRequired: string;
		emailInvalid: string;
		passwordRequired: string;
		signInFailed: string;
		googleSignInFailed: string;
		signInSuccess: string;
		googleSignInSuccess: string;
	};
	register: {
		title: string;
		namePlaceholder: string;
		nameRequired: string;
		nameTooShort: string;
		emailPlaceholder: string;
		passwordPlaceholder: string;
		confirmPasswordPlaceholder: string;
		passwordRequirements: string;
		createAccountButton: string;
		creatingAccount: string;
		backToLogin: string;
		showPassword: string;
		hidePassword: string;
		emailRequired: string;
		passwordRequired: string;
		confirmPasswordRequired: string;
		passwordsDoNotMatch: string;
		passwordTooShort: string;
		passwordStrengthError: string;
		registrationFailed: string;
		accountCreated: string;
	};
	forgotPassword: {
		titleForm: string;
		titleSuccess: string;
		description: string;
		emailPlaceholder: string;
		sendResetLinkButton: string;
		sending: string;
		backToLogin: string;
		resendEmail: string;
		successMessage: string;
		emailRequired: string;
		sendFailed: string;
	};
}

/**
 * Supported auth locales
 */
export type AuthLocale = 'en' | 'de' | 'it' | 'fr' | 'es';

/**
 * All auth translations by locale
 */
export const authTranslations: Record<AuthLocale, AuthTranslations> = {
	en,
	de,
	it,
	fr,
	es,
};

/**
 * Get auth translations by locale
 */
export function getAuthTranslations(locale: string): AuthTranslations {
	const supportedLocale = locale as AuthLocale;
	if (supportedLocale in authTranslations) {
		return authTranslations[supportedLocale];
	}
	// Default to English
	return authTranslations.en;
}

/**
 * Get login translations for a specific locale
 */
export function getLoginTranslations(locale: string): AuthTranslations['login'] {
	return getAuthTranslations(locale).login;
}

/**
 * Get register translations for a specific locale
 */
export function getRegisterTranslations(locale: string): AuthTranslations['register'] {
	return getAuthTranslations(locale).register;
}

/**
 * Get forgot password translations for a specific locale
 */
export function getForgotPasswordTranslations(locale: string): AuthTranslations['forgotPassword'] {
	return getAuthTranslations(locale).forgotPassword;
}
