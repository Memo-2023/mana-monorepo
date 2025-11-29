<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { NutriPhiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// German translations
	const translations = {
		titleForm: 'Passwort zurücksetzen',
		titleSuccess: 'E-Mail gesendet',
		description:
			'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.',
		emailPlaceholder: 'E-Mail',
		sendResetLinkButton: 'Link senden',
		sending: 'Wird gesendet...',
		backToLogin: 'Zurück zur Anmeldung',
		resendEmail: 'E-Mail erneut senden',
		successMessage:
			'Wir haben einen Link zum Zurücksetzen deines Passworts an {email} gesendet. Bitte überprüfe deinen Posteingang.',
		emailRequired: 'E-Mail ist erforderlich',
		sendFailed: 'Fehler beim Senden der E-Mail',
	};

	async function handleForgotPassword(email: string) {
		return auth.forgotPassword(email);
	}
</script>

<svelte:head>
	<title>Passwort zurücksetzen | Nutriphi</title>
</svelte:head>

<ForgotPasswordPage
	appName="Nutriphi"
	logo={NutriPhiLogo}
	primaryColor="#10b981"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#d1fae5"
	darkBackground="#022c22"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
