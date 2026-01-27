<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	let error = $state('');
	let loading = $state(false);

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmail = $derived($page.url.searchParams.get('email') || '');

	// Get redirect URL from query params or sessionStorage (set by AuthGateModal in guest mode)
	const redirectTo = $derived.by(() => {
		const queryRedirect = $page.url.searchParams.get('redirectTo');
		if (queryRedirect) return queryRedirect;

		// Check sessionStorage for return URL (from guest mode)
		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				// Clear it after reading
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}

		return '/';
	});

	async function handleLogin(email: string, password: string) {
		loading = true;
		error = '';

		const result = await authStore.signIn(email, password);

		if (result.success) {
			goto(redirectTo);
		} else {
			error = result.error || 'Anmeldung fehlgeschlagen';
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
	{verified}
	{initialEmail}
/>
