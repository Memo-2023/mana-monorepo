<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import DetailView from '$lib/modules/lasts/views/DetailView.svelte';
	import { useAllLasts } from '$lib/modules/lasts/queries';
	import { RoutePage } from '$lib/components/shell';

	const lasts$ = useAllLasts();
	const entry = $derived(lasts$.value.find((l) => l.id === page.params.id));
</script>

<svelte:head>
	<title>{entry?.title ?? $_('lasts.detail.routeTitle')} - Mana</title>
</svelte:head>

<RoutePage appId="lasts" backHref="/lasts" title={$_('lasts.detail.routeTitle')}>
	{#if lasts$.loading}
		<p class="state">{$_('lasts.detail.loading')}</p>
	{:else if !entry}
		<div class="state">
			<p>{$_('lasts.detail.notFound')}</p>
			<a href="/lasts">{$_('lasts.detail.backLink')}</a>
		</div>
	{:else}
		<DetailView {entry} />
	{/if}
</RoutePage>

<style>
	.state {
		text-align: center;
		padding: 3rem 1rem;
		color: hsl(var(--color-muted-foreground));
	}
	.state a {
		display: inline-block;
		margin-top: 0.5rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
	}
	.state a:hover {
		text-decoration: underline;
	}
</style>
