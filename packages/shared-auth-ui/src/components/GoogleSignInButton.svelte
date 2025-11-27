<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeGoogleAuth, renderGoogleButton, waitForGoogleAuth } from '../utils/googleAuth';

	interface Props {
		onSuccess: (idToken: string) => Promise<void>;
		onError?: (error: Error) => void;
	}

	let { onSuccess, onError }: Props = $props();

	let buttonContainer: HTMLDivElement;
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function handleGoogleSignIn(idToken: string) {
		isLoading = true;
		error = null;

		try {
			await onSuccess(idToken);
		} catch (err) {
			console.error('Error during Google Sign-In:', err);
			error = err instanceof Error ? err.message : 'Google Sign-In failed';
			onError?.(err instanceof Error ? err : new Error('Unknown error during Google Sign-In'));
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		try {
			await waitForGoogleAuth();
			initializeGoogleAuth(handleGoogleSignIn);

			if (buttonContainer) {
				renderGoogleButton(buttonContainer, {
					type: 'standard',
					theme: 'outline',
					size: 'large',
					text: 'signin_with',
					shape: 'pill',
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

<div
	bind:this={buttonContainer}
	class="relative w-full google-btn-wrapper"
	style="min-height: 56px;"
>
	{#if isLoading}
		<div
			class="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10"
		>
			<div
				class="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
			></div>
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
