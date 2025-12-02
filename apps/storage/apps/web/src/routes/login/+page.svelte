<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { StorageLogo } from '@manacore/shared-branding';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getLoginTranslations($locale || 'de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} - Storage</title>
</svelte:head>

<LoginPage
	appName="Storage"
	logo={StorageLogo}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	{goto}
	successRedirect="/files"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#eff6ff"
	darkBackground="#0f172a"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</LoginPage>
