<!--
  List of all LocalDraftVersions for a draft. Highlights the current one;
  "Wiederherstellen" flips the draft's `currentVersionId` back via the
  store. Versions are immutable snapshots so Restore is a pointer change,
  not a destructive revert.
-->
<script lang="ts">
	import { draftsStore } from '../stores/drafts.svelte';
	import type { DraftVersion } from '../types';

	let {
		versions,
		currentVersionId,
		draftId,
	}: {
		versions: DraftVersion[];
		currentVersionId: string | null;
		draftId: string;
	} = $props();

	// Newest on top.
	const sorted = $derived([...versions].sort((a, b) => b.versionNumber - a.versionNumber));

	async function restore(versionId: string) {
		await draftsStore.restoreVersion(draftId, versionId);
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<ul class="history">
	{#each sorted as version (version.id)}
		{@const isCurrent = version.id === currentVersionId}
		<li class="version" class:current={isCurrent}>
			<div class="meta">
				<strong>v{version.versionNumber}</strong>
				{#if version.isAiGenerated}
					<span class="tag ai" title="KI-generiert">KI</span>
				{/if}
				{#if isCurrent}
					<span class="tag current">Aktiv</span>
				{/if}
			</div>
			<div class="stats">
				<span>{version.wordCount} Wörter</span>
				<span class="date">{formatDate(version.createdAt)}</span>
			</div>
			{#if version.summary}
				<p class="summary">{version.summary}</p>
			{/if}
			{#if !isCurrent}
				<button type="button" class="restore" onclick={() => restore(version.id)}>
					Wiederherstellen
				</button>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.history {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.version {
		padding: 0.6rem 0.75rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.version.current {
		border-color: #0ea5e9;
		background: color-mix(in srgb, #0ea5e9 6%, transparent);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.tag {
		font-size: 0.65rem;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.tag.ai {
		background: color-mix(in srgb, #a855f7 15%, transparent);
		color: #a855f7;
	}
	.tag.current {
		background: color-mix(in srgb, #0ea5e9 15%, transparent);
		color: #0ea5e9;
	}
	.stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.summary {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.restore {
		align-self: flex-start;
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.restore:hover {
		background: var(--color-surface-hover, rgba(0, 0, 0, 0.05));
	}
</style>
