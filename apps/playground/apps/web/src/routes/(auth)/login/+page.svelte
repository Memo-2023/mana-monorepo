<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { PlaygroundLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/');

	// Default to German translations
	const translations = $derived(getLoginTranslations('de'));

	// Read verification status from query params
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
	<title>{translations.title} | LLM Playground</title>
</svelte:head>

<LoginPage
	appName="LLM Playground"
	logo={PlaygroundLogo}
	primaryColor="#06b6d4"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#ecfeff"
	darkBackground="#083344"
	{translations}
	{verified}
	{initialEmail}
/>
