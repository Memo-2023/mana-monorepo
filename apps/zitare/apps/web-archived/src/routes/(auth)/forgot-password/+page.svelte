<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { ZitareLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} - Zitare</title>
</svelte:head>

<ForgotPasswordPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</ForgotPasswordPage>
