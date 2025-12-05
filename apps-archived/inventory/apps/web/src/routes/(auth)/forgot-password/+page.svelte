<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { InventoryLogo } from '@manacore/shared-branding';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleRequestReset(email: string) {
		return authStore.requestPasswordReset(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Inventory</title>
</svelte:head>

<ForgotPasswordPage
	appName="Inventory"
	logo={InventoryLogo}
	primaryColor="#14b8a6"
	onForgotPassword={handleRequestReset}
	{goto}
	loginPath="/login"
	lightBackground="#f0fdfa"
	darkBackground="#134e4a"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</ForgotPasswordPage>
