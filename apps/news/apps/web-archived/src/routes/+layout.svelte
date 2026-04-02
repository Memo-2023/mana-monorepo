<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { authStore } from '$lib/stores/auth.svelte';
	import { newsStore } from '$lib/data/local-store';

	let { children } = $props();
	let loading = $state(true);

	onMount(async () => {
		await authStore.initialize();
		await newsStore.initialize();
		loading = false;
	});
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-gray-950">
		<div
			class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"
		></div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-950 text-gray-100">
		{@render children()}
	</div>
{/if}

<Toaster
	position="bottom-right"
	expand={false}
	richColors
	closeButton
	duration={4000}
	visibleToasts={3}
/>
