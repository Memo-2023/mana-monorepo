<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { TodoLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';

	// Get redirect URL from sessionStorage (set by AuthGateModal in guest mode)
	const redirectTo = $derived.by(() => {
		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				// Clear it after reading
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}
		return '/';
	});

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Todo</title>
</svelte:head>

<RegisterPage
	appName="Todo"
	logo={TodoLogo}
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1b4b"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
