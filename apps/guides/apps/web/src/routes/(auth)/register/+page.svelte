<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
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
</script>

<svelte:head>
	<title>{translations.title} | Guides</title>
</svelte:head>

<RegisterPage
	appName="Guides"
	primaryColor="#0d9488"
	onSignUp={(email, password) => authStore.signUp(email, password)}
	onResendVerification={(email) => authStore.resendVerificationEmail(email)}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#f0fdfa"
	darkBackground="#042f2e"
	{translations}
/>
