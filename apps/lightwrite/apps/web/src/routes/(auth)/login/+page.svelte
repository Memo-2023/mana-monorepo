<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { LightWriteLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

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

	// Use English translations
	const translations = getLoginTranslations('en');

	// Read verification status from query params
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		// Implement if needed
		return { success: true };
	}
</script>

<svelte:head>
	<title>Login - LightWrite</title>
</svelte:head>

<LoginPage
	appName="LightWrite"
	logo={LightWriteLogo}
	primaryColor="#f97316"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fff7ed"
	darkBackground="#1c1917"
	{translations}
	{verified}
	{initialEmail}
/>
