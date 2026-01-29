<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { QuestionsLogo } from '@manacore/shared-branding';
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

	// Get translations (default to English)
	const translations = $derived(getRegisterTranslations('en'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Questions</title>
</svelte:head>

<RegisterPage
	appName="Questions"
	logo={QuestionsLogo}
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1033"
	{translations}
/>
