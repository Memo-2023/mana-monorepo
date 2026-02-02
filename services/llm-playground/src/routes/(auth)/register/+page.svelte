<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { PlaygroundLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Default to German translations
	const translations = $derived(getRegisterTranslations('de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | LLM Playground</title>
</svelte:head>

<RegisterPage
	appName="LLM Playground"
	logo={PlaygroundLogo}
	primaryColor="#06b6d4"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#ecfeff"
	darkBackground="#083344"
	{translations}
/>
