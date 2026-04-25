<!--
  List of all LocalDraftVersions for a draft. Highlights the current one;
  "Wiederherstellen" flips the draft's `currentVersionId` back via the
  store. Versions are immutable snapshots so Restore is a pointer change,
  not a destructive revert.

  AI-generated versions also show their generation cost (token usage +
  duration) when the linked Generation row is available, so the user can
  see what each draft cost without digging into Workbench audit views.
-->
<script lang="ts">
	import { draftsStore } from '../stores/drafts.svelte';
	import type { DraftVersion, Generation } from '../types';
	import { formatDate as formatLocaleDate } from '$lib/i18n/format';

	let {
		versions,
		generations = [],
		currentVersionId,
		draftId,
	}: {
		versions: DraftVersion[];
		/** Generations for this draft. Used to show token-usage / duration
		 *  next to AI-generated versions; harmless to omit. */
		generations?: Generation[];
		currentVersionId: string | null;
		draftId: string;
	} = $props();

	// Newest on top.
	const sorted = $derived([...versions].sort((a, b) => b.versionNumber - a.versionNumber));

	const generationById = $derived(new Map(generations.map((g) => [g.id, g])));

	async function restore(versionId: string) {
		await draftsStore.restoreVersion(draftId, versionId);
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return formatLocaleDate(d, {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function genCostLine(version: DraftVersion): string | null {
		if (!version.generationId) return null;
		const gen = generationById.get(version.generationId);
		if (!gen) return null;
		const parts: string[] = [];
		if (gen.tokenUsage) {
			parts.push(`${gen.tokenUsage.input} → ${gen.tokenUsage.output} Tokens`);
		}
		if (gen.durationMs) {
			parts.push(`${(gen.durationMs / 1000).toFixed(1)}s`);
		}
		if (gen.model) parts.push(gen.model);
		return parts.length > 0 ? parts.join(' · ') : null;
	}
</script>

<ul class="history">
	{#each sorted as version (version.id)}
		{@const isCurrent = version.id === currentVersionId}
		{@const costLine = genCostLine(version)}
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
			{#if costLine}
				<div class="cost" title="Verbrauch + Modell der zugehörigen Generation">{costLine}</div>
			{/if}
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
	.cost {
		font-size: 0.7rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		opacity: 0.8;
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
