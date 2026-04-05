<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let error = $state<string | null>(null);
	let processing = $state(true);

	onMount(async () => {
		const urlParams = $page.url.searchParams;
		const code = urlParams.get('code');
		const errorParam = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');
		const type = urlParams.get('type'); // 'signup' or 'recovery' or 'invite' etc.
		const appName = urlParams.get('appName'); // App name for branding
		const next = urlParams.get('next');

		// Handle OAuth errors
		if (errorParam) {
			error = errorDescription || errorParam;
			processing = false;
			setTimeout(() => {
				goto(`/login?error=${encodeURIComponent(error || 'Authentication failed')}`);
			}, 2000);
			return;
		}

		// Determine redirect destination
		let redirectUrl = next || '/';

		// For email verification/signup, redirect to welcome page
		if (type === 'signup' || type === 'email_verification') {
			redirectUrl = `/welcome${appName ? `?appName=${encodeURIComponent(appName)}` : ''}`;
		}

		// Handle OAuth callback with code
		if (code) {
			try {
				// Exchange code for session
				// This is handled by Supabase automatically via the auth callback
				// Just wait a moment and redirect
				setTimeout(() => {
					goto(redirectUrl);
				}, 1000);
			} catch (err) {
				console.error('Auth callback error:', err);
				error = 'Failed to complete authentication';
				processing = false;
				setTimeout(() => {
					goto(`/login?error=${encodeURIComponent(error || '')}`);
				}, 2000);
			}
		} else if (type) {
			// Handle email confirmation callback (from Supabase email links)
			// The session should already be set by Supabase
			// Just redirect to the appropriate page
			setTimeout(() => {
				goto(redirectUrl);
			}, 1000);
		} else {
			// No code or type, redirect to login
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Authenticating... - Mana</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
		{#if processing}
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<h2 class="mb-2 text-2xl font-bold">Authenticating...</h2>
			<p class="text-gray-600 dark:text-gray-400">Please wait while we complete your sign-in.</p>
		{:else if error}
			<div class="mb-4 text-6xl">⚠️</div>
			<h2 class="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">Authentication Error</h2>
			<p class="mb-4 text-gray-600 dark:text-gray-400">
				{error}
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">Redirecting you back to login...</p>
		{/if}
	</div>
</div>
