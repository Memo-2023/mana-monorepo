<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import ManaCoreLogo from '$lib/components/ManaCoreLogo.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<LoginPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onSignIn={handleSignIn}
	onForgotPassword={handleForgotPassword}
	goto={goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/dashboard"
	registerPath="/register"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
/>
