<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { CitycornersLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

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

	const translations = $derived(getLoginTranslations($locale || 'de'));
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
	<title>{translations.title} - CityCorners</title>
</svelte:head>

<LoginPage
	appName="CityCorners"
	logo={CitycornersLogo}
	primaryColor="#2563eb"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	onSendMagicLink={(email) => authStore.sendMagicLink(email)}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#eff6ff"
	darkBackground="#1e1b4b"
	{translations}
	{verified}
	{initialEmail}
/>
