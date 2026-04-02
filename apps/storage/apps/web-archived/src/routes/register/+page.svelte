<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ManaIcon } from '@manacore/shared-branding';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} - Storage</title>
</svelte:head>

<RegisterPage
	appName="Storage"
	logo={ManaIcon}
	primaryColor="#3b82f6"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect="/files"
	loginPath="/login"
	lightBackground="#eff6ff"
	darkBackground="#0f172a"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</RegisterPage>
