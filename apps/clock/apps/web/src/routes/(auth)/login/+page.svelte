<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { ClockLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get redirect URL from query params
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/');

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<LoginPage
	appName="Clock"
	logo={ClockLogo}
	primaryColor="#f59e0b"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fef3c7"
	darkBackground="#1c1917"
/>
