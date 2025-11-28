<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// German translations
	const translations = {
		title: 'Registrieren',
		subtitle: 'Erstelle dein Konto',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		confirmPasswordPlaceholder: 'Passwort wiederholen',
		signUpButton: 'Registrieren',
		signingUp: 'Wird registriert...',
		success: 'Erfolgreich!',
		orDivider: 'oder',
		hasAccount: 'Bereits ein Konto?',
		signIn: 'Jetzt anmelden',
		skipToForm: 'Zum Registrierungsformular springen',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
		passwordRequired: 'Passwort ist erforderlich',
		passwordMinLength: 'Passwort muss mindestens 8 Zeichen haben',
		passwordsNotMatch: 'Passwörter stimmen nicht überein',
		signUpFailed: 'Registrierung fehlgeschlagen',
		signUpSuccess: 'Erfolgreich registriert. Weiterleitung...',
		verificationRequired: 'Bitte überprüfe deine E-Mails zur Bestätigung',
	};

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>Registrieren | Wisekeep</title>
</svelte:head>

<RegisterPage
	appName="Wisekeep"
	logo={ManaCoreLogo}
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1b4b"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
