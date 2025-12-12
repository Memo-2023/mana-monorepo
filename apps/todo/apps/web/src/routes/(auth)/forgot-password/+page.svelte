<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { TodoLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Todo</title>
</svelte:head>

<ForgotPasswordPage
	appName="Todo"
	logo={TodoLogo}
	primaryColor="#8b5cf6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1b4b"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
