<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Loader2, AlertCircle, RefreshCw } from 'lucide-svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let loading = $state(true);
	let initError = $state<string | null>(null);

	onMount(async () => {
		// Check if already initialized
		if (matrixStore.isReady) {
			loading = false;
			return;
		}

		// Try to initialize
		const success = await matrixStore.initialize();

		if (!success) {
			// Check if no credentials (should redirect to login)
			if (!matrixStore.hasStoredCredentials()) {
				goto('/login');
				return;
			}
			// Has credentials but failed to init
			initError = matrixStore.error || 'Failed to connect to Matrix server';
		}

		loading = false;
	});

	onDestroy(() => {
		// Don't destroy on navigation within app routes
		// matrixStore.destroy();
	});

	async function retry() {
		loading = true;
		initError = null;
		const success = await matrixStore.initialize();
		if (!success) {
			initError = matrixStore.error || 'Failed to connect';
		}
		loading = false;
	}

	function logout() {
		matrixStore.logout();
		goto('/login');
	}
</script>

{#if loading}
	<!-- Loading State -->
	<div class="flex h-screen flex-col items-center justify-center gap-4">
		<Loader2 class="h-12 w-12 animate-spin text-primary" />
		<div class="text-center">
			<p class="font-medium">Connecting to Matrix...</p>
			<p class="text-sm text-base-content/60">
				{#if matrixStore.syncState === 'PREPARED'}
					Preparing sync...
				{:else if matrixStore.syncState === 'SYNCING'}
					Syncing messages...
				{:else if matrixStore.syncState === 'CATCHUP'}
					Catching up...
				{:else}
					Initializing...
				{/if}
			</p>
		</div>
	</div>
{:else if initError}
	<!-- Error State -->
	<div class="flex h-screen flex-col items-center justify-center gap-4 p-4">
		<div class="rounded-full bg-error/10 p-4">
			<AlertCircle class="h-12 w-12 text-error" />
		</div>
		<div class="text-center">
			<h2 class="text-xl font-semibold">Connection Failed</h2>
			<p class="mt-2 max-w-md text-base-content/60">{initError}</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-primary" onclick={retry}>
				<RefreshCw class="h-4 w-4" />
				Retry
			</button>
			<button class="btn btn-ghost" onclick={logout}> Sign Out </button>
		</div>
	</div>
{:else if matrixStore.isReady}
	<!-- Ready - Render children -->
	{@render children()}
{:else}
	<!-- Unknown state - redirect to login -->
	<div class="flex h-screen items-center justify-center">
		<p class="text-base-content/60">Redirecting...</p>
	</div>
{/if}
