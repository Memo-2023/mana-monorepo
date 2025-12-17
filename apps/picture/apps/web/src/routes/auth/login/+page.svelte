<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>Anmelden - Picture</title>
</svelte:head>

<LoginPage
	appName="Picture"
	logo={PictureLogo}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/app/gallery"
	registerPath="/auth/signup"
	forgotPasswordPath="/auth/forgot-password"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
