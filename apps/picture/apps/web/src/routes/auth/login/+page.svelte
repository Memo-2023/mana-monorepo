<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { LoginPage, setGoogleClientId } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { APP_VERSION } from '$lib/version';
	import { onMount } from 'svelte';
	import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_APPLE_CLIENT_ID } from '$env/static/public';

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	onMount(() => {
		if (PUBLIC_GOOGLE_CLIENT_ID) {
			setGoogleClientId(PUBLIC_GOOGLE_CLIENT_ID);
		}
	});

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}

	async function handleSignInWithGoogle() {
		// TODO: Implement OAuth with Mana Core Auth when ready
		return { success: false, error: 'Google Sign-In not yet implemented' };
	}

	async function handleSignInWithApple() {
		// TODO: Implement OAuth with Mana Core Auth when ready
		return { success: false, error: 'Apple Sign-In not yet implemented' };
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
	onSignInWithGoogle={PUBLIC_GOOGLE_CLIENT_ID ? handleSignInWithGoogle : undefined}
	onSignInWithApple={PUBLIC_APPLE_CLIENT_ID ? handleSignInWithApple : undefined}
	{goto}
	enableGoogle={!!PUBLIC_GOOGLE_CLIENT_ID}
	enableApple={!!PUBLIC_APPLE_CLIENT_ID}
	successRedirect="/app/gallery"
	registerPath="/auth/signup"
	forgotPasswordPath="/auth/forgot-password"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
	{verified}
	{initialEmail}
	version={APP_VERSION}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
