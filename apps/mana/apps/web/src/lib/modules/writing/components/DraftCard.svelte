<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { dragSource } from '@mana/shared-ui/dnd';
	import StatusBadge from './StatusBadge.svelte';
	import { KIND_LABELS } from '../constants';
	import type { Draft, DraftVersion } from '../types';

	let {
		draft,
		currentVersion,
		onopen,
	}: {
		draft: Draft;
		currentVersion: DraftVersion | null;
		onopen: (draft: Draft) => void;
	} = $props();

	const kind = $derived(KIND_LABELS[draft.kind]);
	const preview = $derived.by(() => {
		const text = (currentVersion?.content ?? '').trim();
		if (!text) return draft.briefing.topic;
		return text.length > 160 ? text.slice(0, 160) + '…' : text;
	});
	const updatedLabel = $derived(formatRelative(draft.updatedAt));

	function formatRelative(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const diff = Date.now() - d.getTime();
		const mins = Math.round(diff / 60000);
		if (mins < 1) return 'gerade eben';
		if (mins < 60) return `vor ${mins} min`;
		const hrs = Math.round(mins / 60);
		if (hrs < 24) return `vor ${hrs} h`;
		const days = Math.round(hrs / 24);
		if (days < 30) return `vor ${days} d`;
		return formatDate(d);
	}

	function open() {
		onopen(draft);
	}
</script>

<button
	type="button"
	class="card"
	onclick={open}
	use:dragSource={{
		type: 'draft',
		data: () => ({
			id: draft.id,
			title: draft.title || draft.briefing.topic || 'Unbenannt',
			kind: draft.kind,
			content: currentVersion?.content ?? '',
			wordCount: currentVersion?.wordCount ?? 0,
			topic: draft.briefing.topic,
		}),
	}}
>
	<header>
		<span class="kind" title={kind.de}>
			<span aria-hidden="true">{kind.emoji}</span>
			{kind.de}
		</span>
		{#if draft.isFavorite}
			<span class="fav" aria-label="Favorit">★</span>
		{/if}
	</header>
	<h3 class="title">{draft.title || draft.briefing.topic || 'Unbenannt'}</h3>
	<p class="preview">{preview}</p>
	<footer>
		<StatusBadge status={draft.status} />
		<span class="words">
			{currentVersion?.wordCount ?? 0} Wörter
		</span>
		<span class="updated">{updatedLabel}</span>
	</footer>
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
		text-align: left;
		font: inherit;
		color: inherit;
		width: 100%;
	}
	.card:hover,
	.card:focus-visible {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-primary) / 0.4);
	}
	.card:focus-visible {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.kind {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.fav {
		color: #f59e0b;
	}
	.title {
		font-size: 1rem;
		margin: 0;
		line-height: 1.3;
	}
	.preview {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.4;
		color: hsl(var(--color-muted-foreground));
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: space-between;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		flex-wrap: wrap;
	}
	.words {
		white-space: nowrap;
	}
	.updated {
		margin-left: auto;
	}
</style>
