<!--
  Library — ListView (M1 skeleton)
  Minimal placeholder that lists all entries grouped by kind. The full
  grid + KindTabs + DetailView land in M2.
-->
<script lang="ts">
	import { useAllEntries, groupByKind } from './queries';
	import { KIND_LABELS, STATUS_LABELS } from './constants';
	import type { LibraryKind } from './types';

	const entries$ = useAllEntries();
	const entries = $derived(entries$.value);
	const grouped = $derived(groupByKind(entries));

	const KIND_ORDER: LibraryKind[] = ['book', 'movie', 'series', 'comic'];
</script>

<div class="library-shell">
	<header class="library-header">
		<h1>Bibliothek</h1>
		<p class="muted">Bücher, Filme, Serien und Comics — alles an einem Ort.</p>
	</header>

	{#if entries$.loading}
		<p class="muted">Lädt…</p>
	{:else}
		{#each KIND_ORDER as kind (kind)}
			{@const list = grouped[kind]}
			<section class="kind-section">
				<h2>
					{KIND_LABELS[kind].emoji}
					{KIND_LABELS[kind].de}
					<span class="count">({list.length})</span>
				</h2>
				{#if list.length === 0}
					<p class="muted">Noch keine Einträge.</p>
				{:else}
					<ul class="entry-list">
						{#each list as entry (entry.id)}
							<li class="entry-row">
								<span class="entry-title">{entry.title}</span>
								{#if entry.year}
									<span class="muted"> · {entry.year}</span>
								{/if}
								<span class="badge">{STATUS_LABELS[entry.status].de}</span>
								{#if entry.rating != null}
									<span class="rating">{entry.rating.toFixed(1)} ★</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}
	{/if}
</div>

<style>
	.library-shell {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.library-header {
		margin-bottom: 2rem;
	}
	.library-header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.75rem;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.875rem;
	}
	.kind-section {
		margin-bottom: 2rem;
	}
	.kind-section h2 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.count {
		color: var(--color-text-muted, #64748b);
		font-weight: normal;
		font-size: 0.9rem;
	}
	.entry-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.entry-row {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-surface, rgba(0, 0, 0, 0.03));
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.entry-title {
		font-weight: 500;
	}
	.badge {
		margin-left: auto;
		font-size: 0.75rem;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.06));
	}
	.rating {
		font-size: 0.8rem;
		color: #f59e0b;
	}
</style>
