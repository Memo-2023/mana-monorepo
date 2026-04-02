<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { PlantaLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Planta</title>
</svelte:head>

<ForgotPasswordPage
	appName="Planta"
	logo={PlantaLogo}
	primaryColor="#22c55e"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#dcfce7"
	darkBackground="#052e16"
	{translations}
/>
