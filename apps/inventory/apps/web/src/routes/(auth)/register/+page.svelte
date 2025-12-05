<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { InventoryLogo } from '@manacore/shared-branding';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string, name?: string) {
		return authStore.register(email, password, name);
	}
</script>

<svelte:head>
	<title>{translations.title} | Inventory</title>
</svelte:head>

<RegisterPage
	appName="Inventory"
	logo={InventoryLogo}
	primaryColor="#14b8a6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#f0fdfa"
	darkBackground="#134e4a"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
