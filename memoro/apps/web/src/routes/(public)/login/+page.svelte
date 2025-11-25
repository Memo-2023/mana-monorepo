<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage, setGoogleClientId, setAppleConfig } from '@manacore/shared-auth-ui';
	import { MemoroLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { auth } from '$lib/stores/auth';
	import { env } from '$lib/config/env';
	import { onMount } from 'svelte';

	// Configure OAuth on mount
	onMount(() => {
		if (env.oauth.googleClientId) {
			setGoogleClientId(env.oauth.googleClientId);
		}
		if (env.oauth.appleClientId && env.oauth.appleRedirectUri) {
			setAppleConfig(env.oauth.appleClientId, env.oauth.appleRedirectUri);
		}
	});

	async function handleSignIn(email: string, password: string) {
		return auth.signIn(email, password);
	}

	async function handleSignInWithGoogle(idToken: string) {
		return auth.signInWithGoogle(idToken);
	}

</script>

<LoginPage
	appName="Memoro"
	logo={MemoroLogo}
	primaryColor="#f8d62b"
	onSignIn={handleSignIn}
	onSignInWithGoogle={handleSignInWithGoogle}
	goto={goto}
	enableGoogle={!!env.oauth.googleClientId}
	enableApple={!!env.oauth.appleClientId}
	successRedirect="/dashboard"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#dddddd"
	darkBackground="#101010"
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
