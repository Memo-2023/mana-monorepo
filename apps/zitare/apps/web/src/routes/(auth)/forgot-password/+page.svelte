<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ZitareLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>Passwort vergessen - Zitare</title>
</svelte:head>

<ForgotPasswordPage
	appName="Zitare"
	logo={ZitareLogo}
	primaryColor="#f59e0b"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#fffbeb"
	darkBackground="#1c1917"
/>
