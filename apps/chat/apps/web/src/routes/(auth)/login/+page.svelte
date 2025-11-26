<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ChatLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get redirect URL from query params
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/chat');

	// German translations
	const translations = {
		title: 'Anmelden',
		subtitle: 'Melde dich mit deinem Konto an',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		rememberMe: 'Angemeldet bleiben',
		forgotPassword: 'Passwort vergessen?',
		signInButton: 'Anmelden',
		signingIn: 'Wird angemeldet...',
		success: 'Erfolgreich!',
		orDivider: 'oder',
		noAccount: 'Noch kein Konto?',
		createAccount: 'Jetzt registrieren',
		skipToForm: 'Zum Login-Formular springen',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
		passwordRequired: 'Passwort ist erforderlich',
		signInFailed: 'Anmeldung fehlgeschlagen',
		googleSignInFailed: 'Google-Anmeldung fehlgeschlagen',
		signInSuccess: 'Erfolgreich angemeldet. Weiterleitung...',
		googleSignInSuccess: 'Erfolgreich mit Google angemeldet. Weiterleitung...'
	};

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>Anmelden | ManaChat</title>
</svelte:head>

<LoginPage
	appName="ManaChat"
	logo={ChatLogo}
	primaryColor="#0ea5e9"
	onSignIn={handleSignIn}
	goto={goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#e0f2fe"
	darkBackground="#0c1929"
	{translations}
/>
