<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { PlantaLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get redirect URL from sessionStorage
	const redirectTo = $derived.by(() => {
		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}
		return '/dashboard';
	});

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Planta</title>
</svelte:head>

<RegisterPage
	appName="Planta"
	logo={PlantaLogo}
	primaryColor="#22c55e"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#dcfce7"
	darkBackground="#052e16"
	{translations}
/>
