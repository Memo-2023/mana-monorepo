<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ManaIcon } from '@manacore/shared-branding';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { APP_VERSION } from '$lib/version';
	import '$lib/i18n';

	const translations = $derived(getLoginTranslations($locale || 'de'));

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} - Storage</title>
</svelte:head>

<LoginPage
	appName="Storage"
	logo={ManaIcon}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	onSendMagicLink={(email) => authStore.sendMagicLink(email)}
	{goto}
	successRedirect="/files"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#eff6ff"
	darkBackground="#0f172a"
	{translations}
	{verified}
	{initialEmail}
	version={APP_VERSION}
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
</LoginPage>
