<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { QuestionsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get translations (default to English)
	const translations = $derived(getForgotPasswordTranslations('en'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Questions</title>
</svelte:head>

<ForgotPasswordPage
	appName="Questions"
	logo={QuestionsLogo}
	primaryColor="#8b5cf6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f3e8ff"
	darkBackground="#1e1033"
	{translations}
/>
