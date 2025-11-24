<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeAppleAuth, signInWithApple, waitForAppleAuth } from '../utils/appleAuth';

	interface Props {
		onError?: (error: Error) => void;
	}

	let { onError }: Props = $props();

	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let sdkLoaded = $state(false);

	async function handleAppleSignIn() {
		isLoading = true;
		error = null;

		try {
			await signInWithApple();
		} catch (err) {
			console.error('Error initiating Apple Sign-In:', err);
			error = err instanceof Error ? err.message : 'Failed to initiate Apple Sign-In';
			onError?.(err instanceof Error ? err : new Error('Unknown error during Apple Sign-In'));
			isLoading = false;
		}
	}

	onMount(async () => {
		try {
			await waitForAppleAuth();
			const initialized = initializeAppleAuth();
			if (initialized) {
				sdkLoaded = true;
			} else {
				console.warn('Apple Sign-In not configured - hiding button');
			}
		} catch (err) {
			console.error('Error loading Apple Sign-In:', err);
		}
	});
</script>

{#if sdkLoaded}
	<div class="space-y-3">
		{#if error}
			<div class="rounded-xl bg-red-500/20 border border-red-500/30 p-3 text-sm text-red-500">
				{error}
			</div>
		{/if}

		<button
			onclick={handleAppleSignIn}
			disabled={isLoading}
			class="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-black border border-gray-800 px-4 font-medium text-white transition-all hover:bg-gray-900 disabled:opacity-50"
		>
			{#if isLoading}
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
			{:else}
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
					/>
				</svg>
			{/if}
			<span>{isLoading ? 'Signing in...' : 'Continue with Apple'}</span>
		</button>
	</div>
{/if}
