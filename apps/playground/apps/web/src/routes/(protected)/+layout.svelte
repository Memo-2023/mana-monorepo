<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	let isChecking = $state(true);

	onMount(async () => {
		await authStore.initialize();
		if (!authStore.isAuthenticated) {
			const currentPath = $page.url.pathname;
			goto(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
			return;
		}
		isChecking = false;
	});
</script>

{#if isChecking}
	<div
		class="min-h-screen flex items-center justify-center"
		style="background-color: var(--color-bg);"
	>
		<div
			class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
			style="border-color: var(--color-primary);"
		></div>
	</div>
{:else}
	{@render children()}
{/if}
