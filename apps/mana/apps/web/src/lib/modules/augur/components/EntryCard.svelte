<script lang="ts">
	import VibeBadge from './VibeBadge.svelte';
	import OutcomeBadge from './OutcomeBadge.svelte';
	import { KIND_LABELS, VIBE_COLORS, type AugurEntry } from '../types';

	let {
		entry,
		onclick,
	}: {
		entry: AugurEntry;
		onclick?: (entry: AugurEntry) => void;
	} = $props();
</script>

<button
	type="button"
	class="card"
	style:--vibe-color={VIBE_COLORS[entry.vibe]}
	onclick={() => onclick?.(entry)}
>
	<div class="row">
		<span class="kind">{KIND_LABELS[entry.kind].de}</span>
		<span class="date">{entry.encounteredAt}</span>
	</div>
	<p class="source" title={entry.source}>{entry.source}</p>
	<p class="claim" title={entry.claim}>{entry.claim}</p>
	{#if entry.feltMeaning}
		<p class="felt" title={entry.feltMeaning}>{entry.feltMeaning}</p>
	{/if}
	<div class="footer">
		<VibeBadge vibe={entry.vibe} />
		<OutcomeBadge outcome={entry.outcome} />
	</div>
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.85rem 1rem 0.95rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border-radius: 0.75rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		border-left: 4px solid var(--vibe-color);
		cursor: pointer;
		text-align: left;
		transition:
			transform 0.12s ease,
			border-color 0.12s ease,
			background 0.12s ease;
		width: 100%;
		color: inherit;
		font: inherit;
	}
	.card:hover {
		transform: translateY(-2px);
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.06));
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.5));
	}
	.kind {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--vibe-color);
		opacity: 0.85;
		font-weight: 500;
	}
	.source {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--color-text, inherit);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.claim {
		font-size: 0.85rem;
		color: var(--color-text, inherit);
		opacity: 0.8;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}
	.felt {
		font-size: 0.78rem;
		font-style: italic;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.footer {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.4rem;
	}
</style>
