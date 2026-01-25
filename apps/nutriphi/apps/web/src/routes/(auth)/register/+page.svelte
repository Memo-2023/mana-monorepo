<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { NutriPhiLogo } from '@manacore/shared-branding';
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

	const translations = $derived(getRegisterTranslations('de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | NutriPhi</title>
</svelte:head>

<RegisterPage
	appName="NutriPhi"
	logo={NutriPhiLogo}
	primaryColor="#22C55E"
	onSignUp={handleSignUp}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#dcfce7"
	darkBackground="#052e16"
	{translations}
/>
