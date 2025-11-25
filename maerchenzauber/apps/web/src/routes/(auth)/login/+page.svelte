<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { StorytellerLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleSignInWithGoogle(idToken: string) {
		return authStore.signInWithGoogle(idToken);
	}
</script>

<LoginPage
	appName="Märchenzauber"
	logo={StorytellerLogo}
	primaryColor="#FF6B9D"
	onSignIn={handleSignIn}
	onSignInWithGoogle={handleSignInWithGoogle}
	goto={goto}
	enableGoogle={true}
	enableApple={true}
	successRedirect="/dashboard"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fff5f8"
	darkBackground="#1a1218"
>
	{#snippet headerControls()}
		<LanguageSelector />
	{/snippet}
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
