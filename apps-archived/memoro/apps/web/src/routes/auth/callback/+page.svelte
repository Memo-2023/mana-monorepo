<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';

	let error = $state<string | null>(null);
	let processing = $state(true);

	onMount(async () => {
		const urlParams = $page.url.searchParams;
		const code = urlParams.get('code');
		const errorParam = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');
		const next = urlParams.get('next') || '/dashboard';

		// Handle OAuth errors
		if (errorParam) {
			error = errorDescription || errorParam;
			processing = false;
			setTimeout(() => {
				goto(`/login?error=${encodeURIComponent(error || 'OAuth authentication failed')}`);
			}, 2000);
			return;
		}

		// Handle OAuth callback with code
		if (code) {
			try {
				// For now, we'll redirect back to login with an error
				// Full OAuth implementation would exchange code for tokens via middleware
				error = 'OAuth code exchange not yet implemented. Please use email/password login.';
				processing = false;
				setTimeout(() => {
					goto('/login');
				}, 3000);
			} catch (err) {
				console.error('OAuth callback error:', err);
				error = 'Failed to complete OAuth authentication';
				processing = false;
				setTimeout(() => {
					goto(`/login?error=${encodeURIComponent(error || '')}`);
				}, 2000);
			}
		} else {
			// No code or error, redirect to login
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Authenticating... - Memoro</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="card w-full max-w-md text-center">
		{#if processing}
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<h2 class="text-2xl font-bold mb-2">Authenticating...</h2>
			<p class="text-gray-600 dark:text-gray-400">Please wait while we complete your sign-in.</p>
		{:else if error}
			<div class="text-6xl mb-4">⚠️</div>
			<h2 class="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Authentication Error</h2>
			<p class="text-gray-600 dark:text-gray-400 mb-4">
				{error}
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">Redirecting you back to login...</p>
		{/if}
	</div>
</div>
