<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ZitareLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>Anmelden - Zitare</title>
</svelte:head>

<LoginPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onSignIn={handleSignIn}
	{goto}
	successRedirect="/"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
/>
