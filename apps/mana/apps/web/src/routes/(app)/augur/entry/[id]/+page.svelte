<script lang="ts">
	import { page } from '$app/state';
	import DetailView from '$lib/modules/augur/views/DetailView.svelte';
	import { useAllAugurEntries } from '$lib/modules/augur/queries';
	import { RoutePage } from '$lib/components/shell';

	const entries$ = useAllAugurEntries();
	const entry = $derived(entries$.value.find((e) => e.id === page.params.id));

	const T = {
		fallbackTitle: 'Augur',
		routeTitle: 'Zeichen',
		loading: 'laedt ...',
		notFound: 'Eintrag nicht gefunden.',
		backLink: '← zurueck',
	} as const;
</script>

<svelte:head>
	<title>{entry?.source ?? T.fallbackTitle} - Mana</title>
</svelte:head>

<RoutePage appId="augur" backHref="/augur" title={T.routeTitle}>
	{#if entries$.loading}
		<p class="state">{T.loading}</p>
	{:else if !entry}
		<div class="state">
			<p>{T.notFound}</p>
			<a href="/augur">{T.backLink}</a>
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
