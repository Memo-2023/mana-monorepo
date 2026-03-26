<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { APP_VERSION, BUILD_TIME } from '$lib/version';

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');
</script>

<svelte:head>
	<title>Anmelden - Picture</title>
</svelte:head>

<LoginPage
	appName="Picture"
	logo={PictureLogo}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect="/app/gallery"
	registerPath="/auth/signup"
	forgotPasswordPath="/auth/forgot-password"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
	{verified}
	{initialEmail}
	version={APP_VERSION}
	buildTime={BUILD_TIME}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
