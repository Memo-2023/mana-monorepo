<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import '$lib/i18n';
	import { waitLocale } from '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	let ready = $state(false);

	onMount(async () => {
		await waitLocale();
		theme.initialize();
		await authStore.initialize();
		ready = true;
	});
</script>

{#if ready}
	<div class="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
		{@render children()}
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent"
			></div>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">Laden...</p>
		</div>
	</div>
{/if}
