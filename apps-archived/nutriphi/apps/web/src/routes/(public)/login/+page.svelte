<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { NutriPhiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// Get redirect URL from query params
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/meals');

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
		return auth.signIn(email, password);
	}
</script>

<svelte:head>
	<title>Anmelden | Nutriphi</title>
</svelte:head>

<LoginPage
	appName="Nutriphi"
	logo={NutriPhiLogo}
	primaryColor="#10b981"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#d1fae5"
	darkBackground="#022c22"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
