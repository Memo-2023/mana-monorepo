<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import favicon from '$lib/assets/favicon.svg';
	import { themeStore } from '$lib/theme.svelte';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { Toaster } from 'svelte-sonner';
	import { uloadStore } from '$lib/data/local-store';
	import { authStore } from '$lib/stores/auth.svelte';
	import { initI18n } from '$lib/i18n';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(async () => {
		initI18n();
		themeStore.initialize();
		await authStore.initialize();
		await uloadStore.initialize();
		loading = false;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !appReady}
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
