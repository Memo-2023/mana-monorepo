<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { ContactsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string, name: string) {
		return authStore.signUp(email, password, name);
	}
</script>

<svelte:head>
	<title>{translations.title} | Contacts</title>
</svelte:head>

<RegisterPage
	appName="Contacts"
	logo={ContactsLogo}
	primaryColor="#3b82f6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#eff6ff"
	darkBackground="#1e293b"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
