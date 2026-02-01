<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { ContactsLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// Get redirect URL from sessionStorage (set by AuthGateModal)
	let redirectTo = $state('/');

	onMount(() => {
		const storedReturnUrl = sessionStorage.getItem('auth-return-url');
		if (storedReturnUrl) {
			redirectTo = storedReturnUrl;
			sessionStorage.removeItem('auth-return-url');
		}
	});

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Contacts</title>
</svelte:head>

<RegisterPage
	appName="Contacts"
	logo={ContactsLogo}
	primaryColor="#3b82f6"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#eff6ff"
	darkBackground="#1e293b"
	{translations}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
