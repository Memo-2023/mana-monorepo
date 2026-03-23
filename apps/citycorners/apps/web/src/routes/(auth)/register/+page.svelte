<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { CitycornersLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>Registrieren - CityCorners</title>
</svelte:head>

<RegisterPage
	appName="CityCorners"
	logo={CitycornersLogo}
	primaryColor="#2563eb"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#eff6ff"
	darkBackground="#1e1b4b"
/>
