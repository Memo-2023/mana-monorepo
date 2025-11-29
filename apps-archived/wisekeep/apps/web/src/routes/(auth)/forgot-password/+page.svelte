<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// German translations
	const translations = {
		title: 'Passwort vergessen',
		subtitle: 'Gib deine E-Mail ein, um einen Reset-Link zu erhalten',
		emailPlaceholder: 'E-Mail',
		resetButton: 'Reset-Link senden',
		sending: 'Wird gesendet...',
		success: 'E-Mail gesendet!',
		backToLogin: 'Zurück zur Anmeldung',
		emailRequired: 'E-Mail ist erforderlich',
		emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
		resetFailed: 'Zurücksetzen fehlgeschlagen',
		resetSuccess: 'Bitte überprüfe deine E-Mails',
	};

	async function handleResetPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>Passwort vergessen | Wisekeep</title>
</svelte:head>

<ForgotPasswordPage
	appName="Wisekeep"
	logo={ManaCoreLogo}
	primaryColor="#8b5cf6"
	onResetPassword={handleResetPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1b4b"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
