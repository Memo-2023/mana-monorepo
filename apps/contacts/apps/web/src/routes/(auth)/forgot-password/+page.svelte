<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { ContactsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleResetPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Contacts</title>
</svelte:head>

<ForgotPasswordPage
	appName="Contacts"
	logo={ContactsLogo}
	primaryColor="#3b82f6"
	onResetPassword={handleResetPassword}
	{goto}
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
</ForgotPasswordPage>
