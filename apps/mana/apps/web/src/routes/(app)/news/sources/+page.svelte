<!--
  /news/sources — list all known sources, grouped by topic, with a
  block toggle and a learned-weight indicator.

  Source list is the static SOURCES_META mirror; the toggle hits
  preferencesStore.toggleBlockedSource which updates the singleton
  preferences row in lockstep with the feed engine's blocklist filter.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { usePreferences } from '$lib/modules/news/queries';
	import { preferencesStore } from '$lib/modules/news/stores/preferences.svelte';
	import { ALL_TOPICS, type Topic } from '$lib/modules/news/types';
	import { sourcesForTopic, TOPIC_LABELS } from '$lib/modules/news/sources-meta';

	const prefs$ = usePreferences();
	const prefs = $derived(prefs$.value);

	function isBlocked(slug: string): boolean {
		return prefs.blockedSources.includes(slug);
	}
	function weightOf(slug: string): number {
		return prefs.sourceWeights[slug] ?? 1.0;
	}

	function weightLabel(w: number): string {
		if (w >= 1.5) return '↑';
		if (w >= 1.1) return '↗';
		if (w <= 0.5) return '↓';
		if (w <= 0.9) return '↘';
		return '·';
	}

	async function toggle(slug: string) {
		await preferencesStore.toggleBlockedSource(slug);
	}

	const visibleTopics: Topic[] = ALL_TOPICS as unknown as Topic[];
</script>

<svelte:head>
	<title>Quellen — News — Mana</title>
</svelte:head>

<div class="page">
	<header class="header">
		<button type="button" class="back" onclick={() => goto('/news/preferences')}
			>← Einstellungen</button
		>
		<h1>Quellen</h1>
		<p class="hint">
			{prefs.blockedSources.length} blockiert. Tippe auf eine Quelle um sie ein- oder auszublenden.
		</p>
	</header>

	{#each visibleTopics as topic}
		<section class="topic-section">
			<h2>
				{TOPIC_LABELS[topic].emoji}
				{TOPIC_LABELS[topic].de}
			</h2>
			<div class="source-grid">
				{#each sourcesForTopic(topic) as src}
					{@const blocked = isBlocked(src.slug)}
					{@const weight = weightOf(src.slug)}
					<button type="button" class="source" class:blocked onclick={() => toggle(src.slug)}>
						<span class="name">{src.name}</span>
						<span class="meta">
							<span class="lang">{src.language}</span>
							<span class="weight" title="Gewicht: {weight.toFixed(2)}">{weightLabel(weight)}</span>
							{#if blocked}
								<span class="state">blockiert</span>
							{/if}
						</span>
					</button>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.header {
		padding-top: 0.5rem;
	}
	.back {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-top: 0.25rem;
	}
	.hint {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.5rem;
	}

	.topic-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.topic-section h2 {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}
	.source-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.5rem;
	}
	.source {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem 0.875rem;
		text-align: left;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		cursor: pointer;
	}
	.source.blocked {
		opacity: 0.5;
		text-decoration: line-through;
	}
	.name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.meta {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.weight {
		font-weight: 700;
	}
	.state {
		color: hsl(var(--color-destructive));
		font-weight: 500;
	}
</style>
