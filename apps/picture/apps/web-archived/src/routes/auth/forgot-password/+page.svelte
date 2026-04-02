<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Picture</title>
</svelte:head>

<ForgotPasswordPage
	appName="Picture"
	logo={PictureLogo}
	primaryColor="#3b82f6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/auth/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
/>
