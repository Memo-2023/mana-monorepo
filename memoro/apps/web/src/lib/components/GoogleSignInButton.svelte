<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { initializeGoogleAuth, renderGoogleButton, waitForGoogleAuth } from '$lib/utils/googleAuth';

	// Props
	interface Props {
		onSuccess?: () => void;
		onError?: (error: Error) => void;
	}

	let { onSuccess, onError }: Props = $props();

	// State
	let buttonContainer: HTMLDivElement;
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Handle Google Sign-In callback
	async function handleGoogleSignIn(idToken: string) {
		isLoading = true;
		error = null;

		try {
			console.log('Google Sign-In successful, received ID token');

			// Call auth store's signInWithGoogle method
			// This handles everything: middleware call, token storage, state update
			const result = await auth.signInWithGoogle(idToken);

			if (!result.success) {
				throw new Error(result.error || 'Failed to authenticate with Google');
			}

			console.log('Successfully authenticated with middleware');

			// Navigate to dashboard
			goto('/dashboard');

			onSuccess?.();
		} catch (err) {
			console.error('Error during Google Sign-In:', err);
			error = err instanceof Error ? err.message : 'Google Sign-In failed';
			onError?.(err instanceof Error ? err : new Error('Unknown error during Google Sign-In'));
		} finally {
			isLoading = false;
		}
	}

	// Initialize Google Sign-In on mount
	onMount(async () => {
		try {
			// Wait for Google Identity Services to load
			await waitForGoogleAuth();

			// Initialize with callback
			initializeGoogleAuth(handleGoogleSignIn);

			// Render the button
			if (buttonContainer) {
				renderGoogleButton(buttonContainer, {
					type: 'standard',
					theme: 'outline',
					size: 'large',
					text: 'signin_with',
					shape: 'pill'
				});
			}
		} catch (err) {
			console.error('Error initializing Google Sign-In:', err);
			error = 'Failed to load Google Sign-In';
		}
	});
</script>

{#if error}
	<div class="rounded-xl bg-red-500/20 border border-red-500/30 p-3 text-sm text-red-500 mb-2">
		{error}
	</div>
{/if}

<!-- Google button container with fixed height to prevent layout shift -->
<div bind:this={buttonContainer} class="relative w-full google-btn-wrapper" style="min-height: 56px;">
	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center rounded-xl bg-menu/80 backdrop-blur-sm z-10">
			<div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
		</div>
	{/if}
</div>

<style>
	:global(.google-btn-wrapper > div) {
		width: 100% !important;
		height: 56px !important;
	}

	:global(.google-btn-wrapper iframe) {
		height: 56px !important;
		border-radius: 0.75rem !important;
	}
</style>

<!-- Fallback message if Google SDK doesn't load -->
<noscript>
	<div class="rounded-xl bg-yellow-500/20 border border-yellow-500/30 p-3 text-sm text-yellow-600 dark:text-yellow-400">
		Please enable JavaScript to use Google Sign-In
	</div>
</noscript>
