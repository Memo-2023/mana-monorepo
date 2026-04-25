<script lang="ts">
	import { page } from '$app/state';
	import YearRecapView from '$lib/modules/augur/views/YearRecapView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const T = {
		title: 'Jahresrueckblick',
		invalid: 'Ungueltiges Jahr.',
		back: '← zurueck',
	} as const;

	const year = $derived.by(() => {
		const raw = page.params.year;
		if (!raw) return null;
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) return null;
		return parsed;
	});
</script>

<svelte:head>
	<title>{year ?? T.title} - Augur - Mana</title>
</svelte:head>

<RoutePage appId="augur" backHref="/augur?mode=oracle" title={T.title}>
	{#if year == null}
		<div class="state">
			<p>{T.invalid}</p>
			<a href="/augur">{T.back}</a>
		</div>
	{:else}
		<YearRecapView {year} />
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
</style>
