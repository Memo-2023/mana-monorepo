<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { locale } from 'svelte-i18n';
	import { QuestionsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';
	import { APP_VERSION, BUILD_TIME } from '$lib/version';
	import '$lib/i18n';

	// Get redirect URL from query params or sessionStorage
	const redirectTo = $derived.by(() => {
		const queryRedirect = $page.url.searchParams.get('redirectTo');
		if (queryRedirect) return queryRedirect;

		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}

		return '/';
	});

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	// Read verification status from query params
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');

	async function handleSignIn(email: string, password: string) {
		const result = await authStore.signIn(email, password);
		if (result.success) {
			const token = await authStore.getValidToken();
			apiClient.setAccessToken(token);
		}
		return result;
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Questions</title>
</svelte:head>

<LoginPage
	appName="Questions"
	logo={QuestionsLogo}
	primaryColor="#8b5cf6"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#f3e8ff"
	darkBackground="#1e1033"
	{translations}
	{verified}
	{initialEmail}
	version={APP_VERSION}
	buildTime={BUILD_TIME}
/>
