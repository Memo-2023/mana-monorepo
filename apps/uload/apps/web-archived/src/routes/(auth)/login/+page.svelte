<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<LoginPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#6366f1"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	onSendMagicLink={(email) => authStore.sendMagicLink(email)}
	{goto}
	successRedirect="/my/links"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	translations={{
		title: 'Anmelden',
		subtitle: 'Melde dich mit deinem uLoad Account an',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		rememberMe: 'Angemeldet bleiben',
		forgotPassword: 'Passwort vergessen?',
		signInButton: 'Anmelden',
		signingIn: 'Wird angemeldet...',
		success: 'Erfolg!',
		orDivider: 'oder',
		noAccount: 'Noch kein Account?',
		createAccount: 'Jetzt registrieren',
		skipToForm: 'Zum Login-Formular springen',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
		passwordRequired: 'Passwort ist erforderlich',
		signInFailed: 'Anmeldung fehlgeschlagen',
		signInSuccess: 'Erfolgreich angemeldet. Weiterleitung...',
	}}
/>
