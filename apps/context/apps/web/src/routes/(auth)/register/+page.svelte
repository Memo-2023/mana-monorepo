<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { ContextLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

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

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Context</title>
</svelte:head>

<RegisterPage
	appName="Context"
	logo={ContextLogo}
	primaryColor="#0ea5e9"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1222"
	{translations}
/>
