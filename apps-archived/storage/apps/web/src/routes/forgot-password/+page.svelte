<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ManaIcon } from '@manacore/shared-branding';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleResetPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.title} - Storage</title>
</svelte:head>

<ForgotPasswordPage
	appName="Storage"
	logo={ManaIcon}
	primaryColor="#3b82f6"
	onResetPassword={handleResetPassword}
	{goto}
	loginPath="/login"
	lightBackground="#eff6ff"
	darkBackground="#0f172a"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</ForgotPasswordPage>
