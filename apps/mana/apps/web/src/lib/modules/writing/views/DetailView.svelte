<!--
  Writing — Detail view. Three panels on desktop (collapsing to tabs on
  mobile later): briefing summary, text editor, version history. In M2
  the editor is a plain textarea; M6 adds selection-based refinement
  tools. "Als Checkpoint speichern" freezes the current draft content
  as a numbered version (otherwise typing just edits version v1 in
  place).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import BriefingForm from '../components/BriefingForm.svelte';
	import StatusBadge from '../components/StatusBadge.svelte';
	import VersionEditor from '../components/VersionEditor.svelte';
	import VersionHistory from '../components/VersionHistory.svelte';
	import GenerationStatus from '../components/GenerationStatus.svelte';
	import { draftsStore } from '../stores/drafts.svelte';
	import { generationsStore } from '../stores/generations.svelte';
	import {
		useDraft,
		useVersionsForDraft,
		useCurrentVersionForDraft,
		useGenerationsForDraft,
	} from '../queries';
	import { KIND_LABELS, STATUS_LABELS } from '../constants';
	import type { DraftStatus } from '../types';

	let { id }: { id: string } = $props();

	// The parent route wraps this component in `{#key id}` so each draft
	// gets a fresh mount — the live queries are safe to seed from the
	// initial `id` without reacting to prop changes.
	/* svelte-ignore state_referenced_locally */
	const draft$ = useDraft(id);
	/* svelte-ignore state_referenced_locally */
	const versions$ = useVersionsForDraft(id);
	/* svelte-ignore state_referenced_locally */
	const currentVersion$ = useCurrentVersionForDraft(id);
	/* svelte-ignore state_referenced_locally */
	const generations$ = useGenerationsForDraft(id);
	const draft = $derived(draft$.value);
	const versions = $derived(versions$.value);
	const currentVersion = $derived(currentVersion$.value);
	const generations = $derived(generations$.value);

	// Surface the freshest running generation, or the most recent failure
	// so the user can dismiss it. On success we hide — the new version is
	// already live in the editor via the currentVersionId pointer.
	const latestGeneration = $derived(
		generations.find((g) => g.status === 'queued' || g.status === 'running') ??
			generations.find((g) => g.status === 'failed') ??
			null
	);
	let dismissedGenerationIds = $state<Set<string>>(new Set());
	const visibleGeneration = $derived(
		latestGeneration && !dismissedGenerationIds.has(latestGeneration.id) ? latestGeneration : null
	);

	let briefingOpen = $state(false);
	let saving = $state(false);
	let generating = $state(false);
	let generateError = $state<string | null>(null);

	async function setStatus(next: DraftStatus) {
		if (!draft) return;
		await draftsStore.setStatus(draft.id, next);
	}

	async function toggleFavorite() {
		if (!draft) return;
		await draftsStore.toggleFavorite(draft.id);
	}

	async function saveCheckpoint() {
		if (!draft || !currentVersion || saving) return;
		saving = true;
		try {
			await draftsStore.createCheckpointVersion(draft.id, currentVersion.id);
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!draft) return;
		if (!confirm(`"${draft.title}" wirklich löschen?`)) return;
		await draftsStore.deleteDraft(draft.id);
		goto('/writing');
	}

	async function generate() {
		if (!draft || generating) return;
		generating = true;
		generateError = null;
		try {
			await generationsStore.startDraftGeneration(draft.id);
		} catch (err) {
			generateError = err instanceof Error ? err.message : String(err);
		} finally {
			generating = false;
		}
	}

	function dismissGeneration(id: string) {
		dismissedGenerationIds = new Set([...dismissedGenerationIds, id]);
	}

	const hasDraftContent = $derived((currentVersion?.content ?? '').trim().length > 0);

	const kind = $derived(draft ? KIND_LABELS[draft.kind] : null);
	const targetWords = $derived(draft?.briefing.targetLength?.value ?? null);
	const STATUS_ORDER: DraftStatus[] = ['draft', 'refining', 'complete', 'published'];
</script>

{#if draft$.loading}
	<p class="muted center">Lädt…</p>
{:else if !draft}
	<div class="empty">
		<p>Dieser Draft existiert nicht (mehr).</p>
		<a href="/writing">Zurück zur Übersicht</a>
	</div>
{:else}
	<div class="shell">
		<header class="head">
			<div class="title-row">
				<a href="/writing" class="back">← Alle Drafts</a>
				<div class="title-block">
					<div class="kind" title={kind?.de}>
						<span aria-hidden="true">{kind?.emoji}</span>
						{kind?.de}
					</div>
					<h1>{draft.title || draft.briefing.topic || 'Unbenannt'}</h1>
				</div>
				<div class="actions">
					<button
						type="button"
						class="ghost"
						onclick={toggleFavorite}
						aria-pressed={draft.isFavorite}
						title="Favorit"
					>
						{draft.isFavorite ? '★' : '☆'}
					</button>
					<button type="button" class="ghost danger" onclick={remove}>Löschen</button>
				</div>
			</div>

			<div class="meta-row">
				<StatusBadge status={draft.status} />
				<div class="status-picker">
					{#each STATUS_ORDER as s (s)}
						{#if s !== draft.status}
							<button type="button" class="tiny" onclick={() => setStatus(s)}>
								→ {STATUS_LABELS[s].de}
							</button>
						{/if}
					{/each}
				</div>
			</div>
		</header>

		<section class="briefing-section">
			<button type="button" class="briefing-toggle" onclick={() => (briefingOpen = !briefingOpen)}>
				{briefingOpen ? '▾' : '▸'} Briefing
				{#if !briefingOpen}
					<span class="preview">{draft.briefing.topic}</span>
				{/if}
			</button>
			{#if briefingOpen}
				<BriefingForm mode="edit" {draft} onclose={() => (briefingOpen = false)} />
			{/if}
		</section>

		<div class="columns">
			<section class="editor-column">
				{#if currentVersion}
					<div class="editor-head">
						<div class="version-label">
							<strong>Version {currentVersion.versionNumber}</strong>
							{#if currentVersion.isAiGenerated}
								<span class="ai-tag">KI</span>
							{/if}
						</div>
						<div class="editor-actions">
							<button
								type="button"
								class="generate"
								onclick={generate}
								disabled={generating}
								title={hasDraftContent
									? 'Kompletten Text neu generieren (überschreibt nicht — neue Version)'
									: 'Ersten Entwurf aus dem Briefing generieren'}
							>
								{#if generating}
									Schreibt…
								{:else if hasDraftContent}
									⟳ Neu generieren
								{:else}
									✨ Generate
								{/if}
							</button>
							<button
								type="button"
								class="checkpoint"
								onclick={saveCheckpoint}
								disabled={saving}
								title="Aktuellen Text als neue Version einfrieren"
							>
								{saving ? 'Speichert…' : '＋ Checkpoint'}
							</button>
						</div>
					</div>
					{#if visibleGeneration}
						<GenerationStatus
							generation={visibleGeneration}
							ondismiss={() => dismissGeneration(visibleGeneration.id)}
						/>
					{/if}
					{#if generateError}
						<p class="error">{generateError}</p>
					{/if}
					<VersionEditor version={currentVersion} {targetWords} />
				{:else}
					<p class="muted">Diese Version existiert nicht mehr.</p>
				{/if}
			</section>

			<aside class="history-column">
				<h2>Versionen</h2>
				<VersionHistory
					versions={versions ?? []}
					currentVersionId={draft.currentVersionId}
					draftId={draft.id}
				/>
			</aside>
		</div>
	</div>
{/if}

<style>
	.shell {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.muted {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.muted.center {
		text-align: center;
		margin-top: 2rem;
	}
	.empty {
		max-width: 600px;
		margin: 4rem auto;
		text-align: center;
	}
	.empty a {
		color: #0ea5e9;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.title-block {
		flex: 1;
		min-width: 0;
	}
	.back {
		font-size: 0.85rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		text-decoration: none;
		padding-top: 0.5rem;
	}
	.back:hover {
		color: #0ea5e9;
	}
	.kind {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.2;
	}
	.actions {
		display: inline-flex;
		gap: 0.4rem;
	}
	.ghost {
		padding: 0.4rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.ghost:hover {
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
	}
	.ghost.danger:hover {
		border-color: #ef4444;
		color: #ef4444;
	}
	.meta-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.status-picker {
		display: inline-flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.tiny {
		padding: 0.15rem 0.5rem;
		border-radius: 0.35rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: transparent;
		font-size: 0.75rem;
		cursor: pointer;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.tiny:hover {
		border-color: #0ea5e9;
		color: #0ea5e9;
	}
	.briefing-section {
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.02));
	}
	.briefing-toggle {
		width: 100%;
		text-align: left;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: inherit;
	}
	.briefing-toggle .preview {
		font-weight: normal;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		font-size: 0.85rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		flex: 1;
	}
	.columns {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 1.25rem;
	}
	.editor-column {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.editor-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.ai-tag {
		font-size: 0.65rem;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		background: color-mix(in srgb, #a855f7 15%, transparent);
		color: #a855f7;
		margin-left: 0.4rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.version-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.editor-actions {
		display: inline-flex;
		gap: 0.4rem;
	}
	.generate {
		padding: 0.4rem 0.9rem;
		border-radius: 0.5rem;
		border: 1px solid #0ea5e9;
		background: #0ea5e9;
		color: white;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		font-size: 0.85rem;
	}
	.generate:hover:not(:disabled) {
		background: #0284c7;
		border-color: #0284c7;
	}
	.generate:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.checkpoint {
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		border: 1px solid #0ea5e9;
		background: transparent;
		color: #0ea5e9;
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}
	.checkpoint:hover:not(:disabled) {
		background: color-mix(in srgb, #0ea5e9 10%, transparent);
	}
	.checkpoint:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		color: #ef4444;
		background: color-mix(in srgb, #ef4444 6%, transparent);
		border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
		font-size: 0.85rem;
	}
	.history-column h2 {
		font-size: 0.8rem;
		margin: 0 0 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		font-weight: 500;
	}

	@media (max-width: 900px) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
