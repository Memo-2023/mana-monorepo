<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { PresiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return auth.register(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Presi</title>
</svelte:head>

<RegisterPage
	appName="Presi"
	logo={PresiLogo}
	primaryColor="#f97316"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#fff7ed"
	darkBackground="#1c1210"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
