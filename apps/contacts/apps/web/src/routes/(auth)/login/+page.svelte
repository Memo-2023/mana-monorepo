<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { ContactsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { APP_VERSION, BUILD_TIME } from '$lib/version';
	import '$lib/i18n';

	// Get redirect URL from query params or sessionStorage
	let redirectTo = $state('/');

	onMount(() => {
		// Check sessionStorage first (set by AuthGateModal)
		const storedReturnUrl = sessionStorage.getItem('auth-return-url');
		if (storedReturnUrl) {
			redirectTo = storedReturnUrl;
			sessionStorage.removeItem('auth-return-url');
		} else {
			// Fall back to query params
			redirectTo = $page.url.searchParams.get('redirectTo') || '/';
		}
	});

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Contacts</title>
</svelte:head>

<LoginPage
	appName="Contacts"
	logo={ContactsLogo}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#eff6ff"
	darkBackground="#1e293b"
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
