<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { MoodlitLogo } from '@manacore/shared-branding';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<LoginPage
	appName="Moodlit"
	logo={MoodlitLogo}
	primaryColor="#8b5cf6"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
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
</LoginPage>
