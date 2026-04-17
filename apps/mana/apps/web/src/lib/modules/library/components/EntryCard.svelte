<script lang="ts">
	import CoverImage from './CoverImage.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import RatingStars from './RatingStars.svelte';
	import type { LibraryEntry } from '../types';

	let {
		entry,
		onclick,
	}: {
		entry: LibraryEntry;
		onclick?: (entry: LibraryEntry) => void;
	} = $props();
</script>

<button type="button" class="card" onclick={() => onclick?.(entry)}>
	<div class="cover-wrap">
		<CoverImage url={entry.coverUrl} kind={entry.kind} alt={entry.title} />
		{#if entry.isFavorite}
			<span class="fav" aria-label="Favorit">★</span>
		{/if}
	</div>
	<div class="meta">
		<div class="title" title={entry.title}>{entry.title}</div>
		<div class="sub">
			{#if entry.creators.length > 0}<span class="creators">{entry.creators[0]}</span>{/if}
			{#if entry.year}<span class="year">· {entry.year}</span>{/if}
		</div>
		<div class="row">
			<StatusBadge status={entry.status} />
			{#if entry.rating != null}
				<RatingStars value={entry.rating} readonly size="sm" />
			{/if}
		</div>
	</div>
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		padding: 0;
		background: var(--color-surface, rgba(0, 0, 0, 0.03));
		border-radius: 0.75rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.06));
		cursor: pointer;
		text-align: left;
		transition:
			transform 0.12s ease,
			border-color 0.12s ease;
		overflow: hidden;
		width: 100%;
		color: inherit;
		font: inherit;
	}
	.card:hover {
		transform: translateY(-2px);
		border-color: #a855f7;
	}
	.cover-wrap {
		position: relative;
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.05));
	}
	.fav {
		position: absolute;
		top: 0.4rem;
		right: 0.5rem;
		color: #f59e0b;
		font-size: 1.2rem;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
	}
	.meta {
		padding: 0.6rem 0.75rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.title {
		font-weight: 500;
		font-size: 0.92rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sub {
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
		display: flex;
		gap: 0.25rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.creators {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.25rem;
		gap: 0.3rem;
	}
</style>
