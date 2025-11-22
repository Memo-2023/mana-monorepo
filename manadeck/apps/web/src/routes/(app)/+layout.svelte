<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';

	let { children } = $props();

	onMount(async () => {
		await authStore.initialize();

		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

{#if authStore.loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<div class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
			<p class="mt-4 text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if authStore.isAuthenticated}
	<div class="min-h-screen bg-background">
		<Navbar />
		<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{@render children()}
		</main>
	</div>
{/if}
