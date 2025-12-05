<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { MoodlitLogo } from '@manacore/shared-branding';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get translations based on current locale
	const translations = $derived(getForgotPasswordTranslations($locale || 'de'));

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Moodlit"
	logo={MoodlitLogo}
	primaryColor="#8b5cf6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1a1625"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
