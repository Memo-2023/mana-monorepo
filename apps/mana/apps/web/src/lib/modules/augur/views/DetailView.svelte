<!--
  Augur — Detail View

  Single-entry view. Two modes:
    - Read: shows source, claim, felt meaning, prediction, resolve status.
      "Hat sich das bewahrheitet?" buttons drive the resolve action.
    - Edit: full EntryForm with the entry seeded as initial values.

  Strings live in `T` (interpolation pattern). Real $_('augur.*') keys
  land in M2-i18n.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import EntryForm from '../components/EntryForm.svelte';
	import VibeBadge from '../components/VibeBadge.svelte';
	import OutcomeBadge from '../components/OutcomeBadge.svelte';
	import LivingOracleHint from '../components/LivingOracleHint.svelte';
	import { augurStore } from '../stores/entries.svelte';
	import {
		VisibilityPicker,
		VISIBILITY_METADATA,
		type VisibilityLevel,
	} from '@mana/shared-privacy';
	import {
		KIND_LABELS,
		SOURCE_CATEGORY_LABELS,
		VIBE_COLORS,
		type AugurEntry,
		type AugurOutcome,
	} from '../types';

	let { entry }: { entry: AugurEntry } = $props();

	const T = {
		source: 'Quelle',
		claim: 'Aussage',
		felt: 'Eigene Deutung',
		expected: 'Erwartetes Ergebnis',
		expectedBy: 'Bis',
		probability: 'Wahrscheinlichkeit',
		tags: 'Tags',
		captured: 'Erfasst',
		resolved: 'Aufgeloest',
		outcomeNote: 'Wie es kam',
		resolvePrompt: 'Hat sich das bewahrheitet?',
		resolveYes: 'eingetreten',
		resolvePartly: 'teilweise',
		resolveNo: 'nicht eingetreten',
		resolveReopen: 'erneut oeffnen',
		actionEdit: 'bearbeiten',
		actionArchive: 'archivieren',
		actionDelete: 'loeschen',
		actionCancel: 'abbrechen',
		notePlaceholder: 'Optionale Notiz: wie genau ist es gekommen?',
		confirmDelete: 'Diesen Eintrag wirklich loeschen?',
		visibility: 'Sichtbarkeit',
	} as const;

	async function onVisibilityChange(next: VisibilityLevel) {
		await augurStore.setVisibility(entry.id, next);
	}

	let mode = $state<'view' | 'edit'>('view');
	let resolveNoteOpen = $state(false);
	let resolveNote = $state('');
	let pendingOutcome = $state<AugurOutcome | null>(null);

	function startResolve(outcome: AugurOutcome) {
		pendingOutcome = outcome;
		resolveNote = '';
		resolveNoteOpen = true;
	}

	async function confirmResolve() {
		if (!pendingOutcome) return;
		await augurStore.resolveEntry(entry.id, pendingOutcome, resolveNote.trim() || null);
		pendingOutcome = null;
		resolveNoteOpen = false;
		resolveNote = '';
	}

	async function reopen() {
		await augurStore.resolveEntry(entry.id, 'open', null);
	}

	async function handleArchive() {
		await augurStore.archiveEntry(entry.id);
		goto('/augur');
	}

	async function handleDelete() {
		if (!confirm(T.confirmDelete)) return;
		await augurStore.deleteEntry(entry.id);
		goto('/augur');
	}

	const sourceCategoryLabel = $derived(SOURCE_CATEGORY_LABELS[entry.sourceCategory].de);
</script>

{#if mode === 'edit'}
	<EntryForm mode="edit" initial={entry} onclose={() => (mode = 'view')} />
{:else}
	<article class="detail" style:--vibe-color={VIBE_COLORS[entry.vibe]}>
		<header class="head">
			<div class="head-row">
				<span class="kind">{KIND_LABELS[entry.kind].de}</span>
				<span class="dot">·</span>
				<span class="cat">{sourceCategoryLabel}</span>
				<span class="dot">·</span>
				<span class="date">{entry.encounteredAt}</span>
			</div>
			<h2 class="source">{entry.source}</h2>
			<p class="claim">{entry.claim}</p>
			<div class="badges">
				<VibeBadge vibe={entry.vibe} size="md" />
				<OutcomeBadge outcome={entry.outcome} size="md" />
				{#if entry.probability != null}
					<span class="prob">{Math.round(entry.probability * 100)}%</span>
				{/if}
			</div>
		</header>

		{#if entry.feltMeaning}
			<section class="block">
				<h3>{T.felt}</h3>
				<p>{entry.feltMeaning}</p>
			</section>
		{/if}

		{#if entry.expectedOutcome || entry.expectedBy}
			<section class="block">
				<h3>{T.expected}</h3>
				{#if entry.expectedOutcome}<p>{entry.expectedOutcome}</p>{/if}
				{#if entry.expectedBy}
					<p class="meta">{T.expectedBy}: {entry.expectedBy}</p>
				{/if}
			</section>
		{/if}

		{#if entry.tags.length > 0}
			<section class="block">
				<h3>{T.tags}</h3>
				<div class="tags">
					{#each entry.tags as tag (tag)}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</section>
		{/if}

		{#if entry.livingOracleSnapshot}
			<LivingOracleHint mode="snapshot" snapshot={entry.livingOracleSnapshot} />
		{/if}

		<section class="block">
			<h3>{T.visibility}</h3>
			<VisibilityPicker level={entry.visibility} onChange={onVisibilityChange} />
		</section>

		<section class="block resolve">
			{#if entry.outcome === 'open' && !resolveNoteOpen}
				<h3>{T.resolvePrompt}</h3>
				<div class="resolve-row">
					<button type="button" class="btn yes" onclick={() => startResolve('fulfilled')}>
						{T.resolveYes}
					</button>
					<button type="button" class="btn partly" onclick={() => startResolve('partly')}>
						{T.resolvePartly}
					</button>
					<button type="button" class="btn no" onclick={() => startResolve('not-fulfilled')}>
						{T.resolveNo}
					</button>
				</div>
			{:else if resolveNoteOpen}
				<h3>{T.outcomeNote}</h3>
				<textarea bind:value={resolveNote} placeholder={T.notePlaceholder} rows="3"></textarea>
				<div class="resolve-row">
					<button type="button" class="btn ghost" onclick={() => (resolveNoteOpen = false)}>
						{T.actionCancel}
					</button>
					<button type="button" class="btn primary" onclick={confirmResolve}>
						{T.captured}
					</button>
				</div>
			{:else}
				<h3>{T.resolved}</h3>
				{#if entry.outcomeNote}
					<p>{entry.outcomeNote}</p>
				{/if}
				{#if entry.resolvedAt}
					<p class="meta">{entry.resolvedAt.slice(0, 10)}</p>
				{/if}
				<div class="resolve-row">
					<button type="button" class="btn ghost" onclick={reopen}>{T.resolveReopen}</button>
				</div>
			{/if}
		</section>

		<footer class="actions">
			<button type="button" class="btn ghost" onclick={() => (mode = 'edit')}>
				{T.actionEdit}
			</button>
			<button type="button" class="btn ghost" onclick={handleArchive}>
				{T.actionArchive}
			</button>
			<button type="button" class="btn danger" onclick={handleDelete}>
				{T.actionDelete}
			</button>
		</footer>
	</article>
{/if}

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem;
		max-width: 48rem;
		margin: 0 auto;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border-radius: 1rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		border-left: 5px solid var(--vibe-color);
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.head-row {
		display: flex;
		gap: 0.45rem;
		font-size: 0.78rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.kind {
		color: var(--vibe-color);
		font-weight: 500;
	}
	.dot {
		opacity: 0.5;
	}
	.source {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0.1rem 0 0;
		color: var(--color-text, inherit);
	}
	.claim {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text, inherit);
		opacity: 0.85;
	}
	.badges {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 0.4rem;
	}
	.prob {
		font-size: 0.85rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: color-mix(in srgb, #38bdf8 18%, transparent);
		color: #7dd3fc;
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.block h3 {
		font-size: 0.78rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		margin: 0;
	}
	.block p {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text, inherit);
	}
	.block .meta {
		font-size: 0.82rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.tags {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.tag {
		font-size: 0.78rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--color-surface-muted, rgba(255, 255, 255, 0.06));
		color: var(--color-text-muted, rgba(255, 255, 255, 0.7));
	}
	.resolve textarea {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.55rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--color-surface-input, rgba(255, 255, 255, 0.04));
		color: var(--color-text, inherit);
		resize: vertical;
	}
	.resolve-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.3rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.06));
	}
	.btn {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.btn.primary {
		background: color-mix(in srgb, #7c3aed 24%, transparent);
		border-color: #7c3aed;
		color: #ddd6fe;
	}
	.btn.primary:hover {
		background: color-mix(in srgb, #7c3aed 32%, transparent);
	}
	.btn.yes {
		background: color-mix(in srgb, #10b981 18%, transparent);
		border-color: color-mix(in srgb, #10b981 55%, transparent);
		color: #6ee7b7;
	}
	.btn.partly {
		background: color-mix(in srgb, #f59e0b 18%, transparent);
		border-color: color-mix(in srgb, #f59e0b 55%, transparent);
		color: #fcd34d;
	}
	.btn.no {
		background: color-mix(in srgb, #ef4444 18%, transparent);
		border-color: color-mix(in srgb, #ef4444 55%, transparent);
		color: #fca5a5;
	}
	.btn.ghost {
		background: transparent;
		border-color: var(--color-border, rgba(255, 255, 255, 0.12));
		color: var(--color-text-muted, rgba(255, 255, 255, 0.7));
	}
	.btn.ghost:hover {
		background: var(--color-surface-hover, rgba(255, 255, 255, 0.05));
	}
	.btn.danger {
		background: transparent;
		border-color: color-mix(in srgb, #ef4444 35%, transparent);
		color: #fca5a5;
	}
	.btn.danger:hover {
		background: color-mix(in srgb, #ef4444 14%, transparent);
	}
</style>
