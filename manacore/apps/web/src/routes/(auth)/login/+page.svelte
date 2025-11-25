<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	// Get translations based on current locale
	const translations = $derived(getLoginTranslations($locale || 'de'));

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<LoginPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onSignIn={handleSignIn}
	goto={goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/dashboard"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
