<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { browser, dev } from '$app/environment';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { ChatLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { APP_VERSION, BUILD_TIME } from '$lib/version';
	import '$lib/i18n';

	// Dev credentials - pre-filled in development mode
	const DEV_EMAIL = 'dev@manacore.local';
	const DEV_PASSWORD = 'devpassword123';

	// Get redirect URL from query params or sessionStorage (set by AuthGateModal in guest mode)
	const redirectTo = $derived.by(() => {
		const queryRedirect = $page.url.searchParams.get('redirectTo');
		if (queryRedirect) return queryRedirect;

		// Check sessionStorage for return URL (from guest mode)
		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				// Clear it after reading
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}

		return '/chat';
	});

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');

	// In dev mode, pre-fill with dev credentials unless email is provided via query param
	const initialEmail = $derived($page.url.searchParams.get('email') || (dev ? DEV_EMAIL : ''));
	const initialPassword = $derived(dev ? DEV_PASSWORD : '');

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | ManaChat</title>
</svelte:head>

<LoginPage
	appName="ManaChat"
	logo={ChatLogo}
	primaryColor="#0ea5e9"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#e0f2fe"
	darkBackground="#0c1929"
	{translations}
	{verified}
	{initialEmail}
	{initialPassword}
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
