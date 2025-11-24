<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import {
		parseAppleAuthorizationResponse,
		getStoredReturnUrl,
		clearAppleSignInSession
	} from '@manacore/shared-auth-ui';

	let error = $state<string | null>(null);
	let processing = $state(true);

	onMount(async () => {
		try {
			// Apple may return tokens in URL hash (fragment) or query params
			// Try both locations
			let authResponse = parseAppleAuthorizationResponse($page.url.searchParams);

			// If not found in query params, try URL hash
			if (!authResponse && window.location.hash) {
				const hashParams = new URLSearchParams(window.location.hash.substring(1));
				authResponse = parseAppleAuthorizationResponse(hashParams);
			}

			if (!authResponse) {
				// Check for explicit error from Apple
				const appleError = $page.url.searchParams.get('error');
				if (appleError === 'user_cancelled_authorize') {
					error = 'Sign-in cancelled. Redirecting back...';
					setTimeout(() => {
						goto('/login');
					}, 2000);
					return;
				}

				error = 'Invalid authorization response from Apple';
				processing = false;
				setTimeout(() => {
					goto('/login?error=' + encodeURIComponent(error || ''));
				}, 2000);
				return;
			}

			// Use id_token if available (preferred), otherwise fall back to code
			// The backend expects an identity token (id_token), not an authorization code
			const token = authResponse.id_token || authResponse.code;

			if (!token) {
				error = 'No token received from Apple';
				processing = false;
				setTimeout(() => {
					goto('/login?error=' + encodeURIComponent(error || ''));
				}, 2000);
				return;
			}

			console.log('Using token for authentication:', token.substring(0, 20) + '...');

			// Sign in with Apple using the identity token
			const result = await auth.signInWithApple(token);

			if (!result.success) {
				throw new Error(result.error || 'Failed to authenticate with Apple');
			}

			console.log('Successfully authenticated with Apple');

			// Clear Apple Sign-In session data
			clearAppleSignInSession();

			// Get the return URL (where user was before sign-in)
			const returnUrl = getStoredReturnUrl();

			// Redirect to the return URL or dashboard
			goto(returnUrl);
		} catch (err) {
			console.error('Apple Sign-In callback error:', err);
			error = err instanceof Error ? err.message : 'Failed to complete Apple Sign-In';
			processing = false;

			// Clear session data even on error
			clearAppleSignInSession();

			// Redirect to login with error
			setTimeout(() => {
				goto(`/login?error=${encodeURIComponent(error || 'Apple Sign-In failed')}`);
			}, 2000);
		}
	});
</script>

<svelte:head>
	<title>Signing in with Apple... - Memoro</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="card w-full max-w-md text-center">
		{#if processing}
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-black border-r-transparent dark:border-white dark:border-r-transparent"></div>
			<h2 class="text-2xl font-bold mb-2">Signing in with Apple...</h2>
			<p class="text-gray-600 dark:text-gray-400">
				Please wait while we complete your authentication.
			</p>
		{:else if error}
			<div class="text-6xl mb-4">⚠️</div>
			<h2 class="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Authentication Error</h2>
			<p class="text-gray-600 dark:text-gray-400 mb-4">
				{error}
			</p>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Redirecting you back to login...
			</p>
		{/if}
	</div>
</div>
