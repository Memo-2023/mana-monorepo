<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import StorytellerLogo from '$lib/components/StorytellerLogo.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleSignInWithGoogle(idToken: string) {
		return authStore.signInWithGoogle(idToken);
	}

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<LoginPage
	appName="Storyteller"
	logo={StorytellerLogo}
	primaryColor="#6366f1"
	onSignIn={handleSignIn}
	onSignInWithGoogle={handleSignInWithGoogle}
	onForgotPassword={handleForgotPassword}
	goto={goto}
	enableGoogle={true}
	enableApple={true}
	successRedirect="/dashboard"
	registerPath="/register"
	lightBackground="#f5f5f5"
	darkBackground="#121212"
/>
