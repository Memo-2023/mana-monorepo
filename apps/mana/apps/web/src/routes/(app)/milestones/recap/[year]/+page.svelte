<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import YearRecapView from '$lib/components/milestones/YearRecapView.svelte';
	import { RoutePage } from '$lib/components/shell';

	const year = $derived.by(() => {
		const raw = page.params.year;
		if (!raw) return null;
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) return null;
		return parsed;
	});
</script>

<svelte:head>
	<title>{year ?? $_('milestones.recap.titleFallback')} - Milestones - Mana</title>
</svelte:head>

<RoutePage appId="milestones" backHref="/milestones" title={$_('milestones.recap.titleFallback')}>
	{#if year == null}
		<div class="state">
			<p>{$_('milestones.recap.invalid')}</p>
			<a href="/milestones">{$_('milestones.recap.backLink')}</a>
		</div>
	{:else}
		<YearRecapView {year} />
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
