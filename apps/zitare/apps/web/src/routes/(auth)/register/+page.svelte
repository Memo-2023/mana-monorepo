<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ZitareLogo } from '@manacore/shared-branding';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string, name: string) {
		return authStore.signUp(email, password, name);
	}
</script>

<svelte:head>
	<title>{translations.title} - Zitare</title>
</svelte:head>

<RegisterPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</RegisterPage>
