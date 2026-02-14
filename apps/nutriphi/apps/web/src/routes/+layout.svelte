<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		authStore.initialize().then(() => {
			loading = false;
		});
	});
</script>

<svelte:head>
	{#if appReady}
		<title>{$t('app.name')} - {$t('app.tagline')}</title>
	{:else}
		<title>NutriPhi</title>
	{/if}
</svelte:head>

{#if !appReady}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
		></div>
	</div>
{:else}
	{@render children()}
{/if}
