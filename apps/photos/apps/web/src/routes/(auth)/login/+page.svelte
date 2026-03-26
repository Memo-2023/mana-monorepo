<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { getLoginTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { APP_VERSION, BUILD_TIME } from '$lib/version';
	import '$lib/i18n';

	let redirectTo = $state('/');

	onMount(() => {
		const storedReturnUrl = sessionStorage.getItem('auth-return-url');
		if (storedReturnUrl) {
			redirectTo = storedReturnUrl;
			sessionStorage.removeItem('auth-return-url');
		} else {
			redirectTo = $page.url.searchParams.get('redirectTo') || '/';
		}
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
	<title>{translations.title} | Photos</title>
</svelte:head>

<LoginPage
	appName="Photos"
	primaryColor="#8b5cf6"
	onSignIn={handleSignIn}
	onResendVerification={handleResendVerification}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	{goto}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#faf5ff"
	darkBackground="#1e1b4b"
	{translations}
	{verified}
	{initialEmail}
	version={APP_VERSION}
	buildTime={BUILD_TIME}
/>
