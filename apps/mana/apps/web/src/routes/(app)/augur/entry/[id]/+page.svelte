<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import DetailView from '$lib/modules/augur/views/DetailView.svelte';
	import { useAllAugurEntries } from '$lib/modules/augur/queries';
	import { RoutePage } from '$lib/components/shell';

	const entries$ = useAllAugurEntries();
	const entry = $derived(entries$.value.find((e) => e.id === page.params.id));
</script>

<svelte:head>
	<title>{entry?.source ?? $_('augur.route.detailFallbackTitle')} - Mana</title>
</svelte:head>

<RoutePage appId="augur" backHref="/augur" title={$_('augur.route.detailRouteTitle')}>
	{#if entries$.loading}
		<p class="state">{$_('augur.route.loading')}</p>
	{:else if !entry}
		<div class="state">
			<p>{$_('augur.route.notFound')}</p>
			<a href="/augur">{$_('augur.route.backLink')}</a>
		</div>
	{:else}
		<DetailView {entry} />
	{/if}
</RoutePage>

<style>
	.state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.state a {
		display: inline-block;
		margin-top: 0.5rem;
		color: #c4b5fd;
		text-decoration: none;
	}
	.state a:hover {
		text-decoration: underline;
	}
</style>
