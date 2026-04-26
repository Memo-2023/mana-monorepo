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
	import { _ } from 'svelte-i18n';
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
			parts.push(
				$_('writing.version_history.tokens_label', {
					values: { input: gen.tokenUsage.input, output: gen.tokenUsage.output },
				})
			);
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
					<span class="tag ai" title={$_('writing.version_history.badge_ai_title')}
						>{$_('writing.version_history.badge_ai')}</span
					>
				{/if}
				{#if isCurrent}
					<span class="tag current">{$_('writing.version_history.badge_active')}</span>
				{/if}
			</div>
			<div class="stats">
				<span
					>{$_('writing.version_history.word_count', {
						values: { count: version.wordCount },
					})}</span
				>
				<span class="date">{formatDate(version.createdAt)}</span>
			</div>
			{#if costLine}
				<div class="cost" title={$_('writing.version_history.cost_title')}>{costLine}</div>
			{/if}
			{#if version.summary}
				<p class="summary">{version.summary}</p>
			{/if}
			{#if !isCurrent}
				<button type="button" class="restore" onclick={() => restore(version.id)}>
					{$_('writing.version_history.restore')}
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
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.version.current {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.06);
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
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}
	.stats {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.cost {
		font-size: 0.7rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.8;
	}
	.summary {
		margin: 0;
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
	}
	.restore {
		align-self: flex-start;
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.restore:hover {
		background: hsl(var(--color-surface-hover));
	}
</style>
