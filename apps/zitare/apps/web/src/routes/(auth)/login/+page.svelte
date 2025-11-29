<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ZitareLogo } from '@manacore/shared-branding';
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
	<title>{translations.title} - Zitare</title>
</svelte:head>

<LoginPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onSignIn={handleSignIn}
	{goto}
	successRedirect="/"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</LoginPage>
