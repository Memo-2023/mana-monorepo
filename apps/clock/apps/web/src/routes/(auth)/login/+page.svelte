<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	let error = $state('');
	let loading = $state(false);

	async function handleLogin(email: string, password: string) {
		loading = true;
		error = '';

		const result = await authStore.signIn(email, password);

		if (result.success) {
			goto('/');
		} else {
			error = result.error || 'Login fehlgeschlagen';
		}

		loading = false;
	}
</script>

<LoginPage
	appName="Clock"
	appLogo=""
	{loading}
	{error}
	onSubmit={handleLogin}
	registerHref="/register"
	forgotPasswordHref="/forgot-password"
/>
