<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import ManaDeckLogo from '$lib/components/ManaDeckLogo.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<LoginPage
	appName="ManaDeck"
	logo={ManaDeckLogo}
	primaryColor="#8b5cf6"
	onSignIn={handleSignIn}
	onForgotPassword={handleForgotPassword}
	goto={goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/decks"
	registerPath="/register"
	lightBackground="#faf5ff"
	darkBackground="#1a1625"
/>
