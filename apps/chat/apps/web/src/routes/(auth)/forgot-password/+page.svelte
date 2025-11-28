<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ChatLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
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
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>Passwort zurücksetzen | ManaChat</title>
</svelte:head>

<ForgotPasswordPage
	appName="ManaChat"
	logo={ChatLogo}
	primaryColor="#0ea5e9"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#e0f2fe"
	darkBackground="#0c1929"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
