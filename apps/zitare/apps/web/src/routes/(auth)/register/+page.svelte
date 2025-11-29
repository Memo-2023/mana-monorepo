<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ZitareLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>Registrieren - Zitare</title>
</svelte:head>

<RegisterPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
/>
