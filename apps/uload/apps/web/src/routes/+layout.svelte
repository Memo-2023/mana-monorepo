<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { themeStore } from '$lib/theme.svelte';
	import { initLocale } from '$lib/locale';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { uloadStore } from '$lib/data/local-store';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		initLocale();
		await uloadStore.initialize();
		loading = false;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div
			class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"
		></div>
	</div>
{:else}
	{@render children?.()}
{/if}

<Toaster
	position="bottom-right"
	expand={false}
	richColors
	closeButton
	duration={4000}
	visibleToasts={3}
/>
