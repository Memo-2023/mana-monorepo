<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	// Initialize auth on mount
	$effect(() => {
		authStore.initialize();
	});
</script>

<svelte:head>
	<title>{$t('app.name')} - {$t('app.tagline')}</title>
</svelte:head>

{#if $i18nLoading}
	<div class="flex min-h-screen items-center justify-center">
		<p>{$t('app.loading')}</p>
	</div>
{:else}
	{@render children()}
{/if}
