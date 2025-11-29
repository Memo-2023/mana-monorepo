<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// Get redirect URL from query params
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/dashboard');

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
		googleSignInSuccess: 'Erfolgreich mit Google angemeldet. Weiterleitung...',
	};

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>Anmelden | Wisekeep</title>
</svelte:head>

<LoginPage
	appName="Wisekeep"
	logo={ManaCoreLogo}
	primaryColor="#8b5cf6"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#f3e8ff"
	darkBackground="#1e1b4b"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
