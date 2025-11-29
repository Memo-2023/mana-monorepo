<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { NutriPhiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// German translations
	const translations = {
		title: 'Konto erstellen',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		confirmPasswordPlaceholder: 'Passwort bestätigen',
		passwordRequirements:
			'Passwort muss mindestens 8 Zeichen mit Kleinbuchstaben, Großbuchstaben, Zahl und Sonderzeichen enthalten.',
		createAccountButton: 'Konto erstellen',
		creatingAccount: 'Wird erstellt...',
		backToLogin: 'Zurück zur Anmeldung',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		passwordRequired: 'Passwort ist erforderlich',
		confirmPasswordRequired: 'Bitte bestätige dein Passwort',
		passwordsDoNotMatch: 'Passwörter stimmen nicht überein',
		passwordTooShort: 'Passwort muss mindestens 8 Zeichen lang sein',
		passwordStrengthError:
			'Passwort muss Kleinbuchstaben, Großbuchstaben, Zahl und Sonderzeichen enthalten',
		registrationFailed: 'Registrierung fehlgeschlagen',
		accountCreated: 'Konto erstellt! Bitte überprüfe deine E-Mails zur Bestätigung.',
	};

	async function handleSignUp(email: string, password: string) {
		return auth.signUp(email, password);
	}
</script>

<svelte:head>
	<title>Registrieren | Nutriphi</title>
</svelte:head>

<RegisterPage
	appName="Nutriphi"
	logo={NutriPhiLogo}
	primaryColor="#10b981"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/meals"
	loginPath="/login"
	lightBackground="#d1fae5"
	darkBackground="#022c22"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
