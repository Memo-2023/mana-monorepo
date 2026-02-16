<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { LightWriteLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get redirect URL from sessionStorage
	const redirectTo = $derived.by(() => {
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
	const translations = getRegisterTranslations('en');

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		// Implement if needed
		return { success: true };
	}
</script>

<svelte:head>
	<title>Register - LightWrite</title>
</svelte:head>

<RegisterPage
	appName="LightWrite"
	logo={LightWriteLogo}
	primaryColor="#f97316"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#fff7ed"
	darkBackground="#1c1917"
	{translations}
/>
