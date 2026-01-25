<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { NutriPhiLogo } from '@manacore/shared-branding';
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

	// German translations (NutriPhi is German-focused)
	const translations = $derived(getLoginTranslations('de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | NutriPhi</title>
</svelte:head>

<LoginPage
	appName="NutriPhi"
	logo={NutriPhiLogo}
	primaryColor="#22C55E"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#dcfce7"
	darkBackground="#052e16"
	{translations}
/>
