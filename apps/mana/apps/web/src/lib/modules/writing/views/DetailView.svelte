<!--
  Writing — Detail view. Three panels on desktop (collapsing to tabs on
  mobile later): briefing summary, text editor, version history. In M2
  the editor is a plain textarea; M6 adds selection-based refinement
  tools. "Als Checkpoint speichern" freezes the current draft content
  as a numbered version (otherwise typing just edits version v1 in
  place).
-->
<script lang="ts">
	import { formatDateTime } from '$lib/i18n/format';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import BriefingForm from '../components/BriefingForm.svelte';
	import StatusBadge from '../components/StatusBadge.svelte';
	import VersionEditor from '../components/VersionEditor.svelte';
	import type { EditorSelection } from '../components/VersionEditor.svelte';
	import VersionHistory from '../components/VersionHistory.svelte';
	import GenerationStatus from '../components/GenerationStatus.svelte';
	import SelectionToolbar from '../components/SelectionToolbar.svelte';
	import ExportMenu from '../components/ExportMenu.svelte';
	import type {
		SelectionToolKind,
		SelectionToolInvocation,
	} from '../components/SelectionToolbar.svelte';
	import RefinementPanel from '../components/RefinementPanel.svelte';
	import type { RefinementState } from '../components/RefinementPanel.svelte';
	import { draftsStore } from '../stores/drafts.svelte';
	import { generationsStore } from '../stores/generations.svelte';
	import {
		useDraft,
		useVersionsForDraft,
		useCurrentVersionForDraft,
		useGenerationsForDraft,
		useAllStyles,
	} from '../queries';
	import { KIND_LABELS, STATUS_LABELS } from '../constants';
	import { getStylePreset } from '../presets/styles';
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

	// Selection refinement (M6).
	let activeSelection = $state<EditorSelection | null>(null);
	let refinement = $state<
		| (RefinementState & {
				generationId?: string;
				selection: EditorSelection;
				params?: SelectionToolInvocation['params'];
		  })
		| null
	>(null);
	// One-step undo target after an accepted refinement. Cleared when
	// the user starts the next refinement or navigates away.
	let refineUndo = $state<{ content: string; label: string } | null>(null);
	// Nonce string that VersionEditor watches to swap its local text
	// after an apply / undo. Monotonic so two identical-content swaps
	// still trigger a re-sync.
	let forceEditorContent = $state<string | null>(null);

	const TOOL_LABEL: Record<SelectionToolKind, string> = {
		'selection-shorten': 'Kürzen',
		'selection-expand': 'Erweitern',
		'selection-tone': 'Ton ändern',
		'selection-rewrite': 'Umschreiben',
		'selection-translate': 'Übersetzen',
	};

	async function setStatus(next: DraftStatus) {
		if (!draft) return;
		await draftsStore.setStatus(draft.id, next);
	}

	async function toggleFavorite() {
		if (!draft) return;
		await draftsStore.toggleFavorite(draft.id);
	}

	async function onVisibilityChange(next: VisibilityLevel) {
		if (!draft) return;
		await draftsStore.setVisibility(draft.id, next);
	}

	let shareCopied = $state(false);
	let shareCopyTimer: ReturnType<typeof setTimeout> | null = null;

	async function copyShareToken() {
		// The public read-URL for a draft lands with M10 (Publish-Hooks).
		// Until then we copy the bare token so the user has *something* to
		// keep — when the route goes live, the URL can be reconstructed as
		// `<origin>/share/writing/<token>`.
		if (!draft?.unlistedToken) return;
		try {
			await navigator.clipboard.writeText(draft.unlistedToken);
			shareCopied = true;
			if (shareCopyTimer) clearTimeout(shareCopyTimer);
			shareCopyTimer = setTimeout(() => (shareCopied = false), 2000);
		} catch {
			// Clipboard API can fail (e.g. insecure context). Swallow;
			// the user can still read the token from the DOM.
		}
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

	// ─── Selection-refinement handlers (M6) ──────────────────

	async function runRefinement(invocation: SelectionToolInvocation, selection: EditorSelection) {
		if (!draft || !currentVersion) return;
		// Fresh refinements supersede any visible undo target; otherwise
		// "Rückgängig" would revert to a pre-previous-refinement state
		// the user has already moved past.
		refineUndo = null;
		refinement = {
			kind: invocation.kind,
			toolLabel: TOOL_LABEL[invocation.kind],
			originalText: selection.text,
			status: 'running',
			selection,
			params: invocation.params,
		};
		try {
			const { generationId, refined } = await generationsStore.refineSelection(
				draft.id,
				currentVersion.id,
				selection,
				invocation.kind,
				// The store validates params shape per kind; undefined is fine
				// for the two no-param kinds (shorten / expand).
				invocation.params as never
			);
			if (!refinement || refinement.selection !== selection) return; // user moved on
			refinement = {
				...refinement,
				status: 'succeeded',
				refined,
				generationId,
			};
		} catch (err) {
			if (!refinement || refinement.selection !== selection) return;
			refinement = {
				...refinement,
				status: 'failed',
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	async function acceptRefinement() {
		if (!refinement || !currentVersion) return;
		if (refinement.status !== 'succeeded' || !refinement.refined || !refinement.generationId) {
			return;
		}
		const { before, after } = await generationsStore.applyRefinement(
			currentVersion.id,
			refinement.selection,
			refinement.refined,
			refinement.generationId
		);
		// Nudge the editor to replace its local text with the new content.
		// `forceContent` is watched as a nonce so identical strings still
		// trigger a re-sync if two applies happen back to back.
		forceEditorContent = after;
		refineUndo = { content: before, label: refinement.toolLabel };
		refinement = null;
		activeSelection = null;
	}

	function retryRefinement() {
		if (!refinement) return;
		const sel = refinement.selection;
		const params = refinement.params;
		void runRefinement({ kind: refinement.kind, params }, sel);
	}

	function cancelRefinement() {
		refinement = null;
	}

	async function undoLastRefinement() {
		if (!refineUndo || !currentVersion) return;
		const restored = refineUndo.content;
		await draftsStore.updateVersionContent(currentVersion.id, restored);
		forceEditorContent = restored;
		refineUndo = null;
	}

	// ─── Keyboard shortcuts ────────────────────────────────
	// ⌘G / Ctrl+G              → Generate (or "neu generieren")
	// ⌘⇧S / Ctrl+Shift+S       → Save checkpoint
	// ⌘Z / Ctrl+Z              → Undo last refinement (only when refineUndo is set)
	// We listen at document level; modifier-based combos are safe even
	// when the textarea has focus. ⌘Z without a refineUndo target falls
	// through to the textarea's native undo, which the user expects.
	onMount(() => {
		function onKey(ev: KeyboardEvent) {
			const mod = ev.metaKey || ev.ctrlKey;
			if (!mod) return;
			const key = ev.key.toLowerCase();
			if (key === 'g' && !ev.shiftKey && !ev.altKey) {
				ev.preventDefault();
				void generate();
				return;
			}
			if (key === 's' && ev.shiftKey && !ev.altKey) {
				ev.preventDefault();
				void saveCheckpoint();
				return;
			}
			if (key === 'z' && !ev.shiftKey && !ev.altKey && refineUndo) {
				ev.preventDefault();
				void undoLastRefinement();
				return;
			}
		}
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});

	const hasDraftContent = $derived((currentVersion?.content ?? '').trim().length > 0);

	const kind = $derived(draft ? KIND_LABELS[draft.kind] : null);
	const targetWords = $derived(draft?.briefing.targetLength?.value ?? null);
	const STATUS_ORDER: DraftStatus[] = ['draft', 'refining', 'complete', 'published'];

	// Resolve the active style's display name: preset ids are static
	// code; custom ids are looked up in the reactive styles list. Falls
	// back to null when the draft has no style set (ad-hoc).
	const allStyles$ = useAllStyles();
	const allStyles = $derived(allStyles$.value);
	const activeStyleName = $derived.by<string | null>(() => {
		const sid = draft?.styleId;
		if (!sid) return null;
		if (sid.startsWith('preset:')) {
			const preset = getStylePreset(sid.slice('preset:'.length));
			return preset ? preset.name.de : null;
		}
		const custom = allStyles.find((s) => s.id === sid);
		return custom ? custom.name : null;
	});
</script>

{#if draft$.loading}
	<p class="muted center">Lädt…</p>
{:else if !draft}
	<div class="empty">
		<p>Dieser Draft existiert nicht (mehr).</p>
		<a href="/writing">Zurück zur Übersicht</a>
	</div>
{:else}
	<!--
	  Print target — only visible when the user triggers Drucken/PDF
	  via the ExportMenu (which calls window.print()). The screen layout
	  is suppressed by @media print so the printed page is just title +
	  body, without the workbench chrome.
	-->
	<article class="print-target" aria-hidden="true">
		<h1 class="print-title">{draft.title || draft.briefing.topic || 'Unbenannt'}</h1>
		{#if currentVersion}
			<div class="print-body">{currentVersion.content}</div>
		{/if}
	</article>

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
				<div class="visibility-slot">
					<VisibilityPicker level={draft.visibility} onChange={onVisibilityChange} />
				</div>
			</div>

			{#if draft.visibility === 'unlisted' && draft.unlistedToken}
				<div
					class="share-row"
					title="Öffentlicher Link kommt mit M10 (Publish-Hooks). Bis dahin: Token kopieren."
				>
					<span class="share-label">🔗 Unlisted-Token:</span>
					<code class="share-token">{draft.unlistedToken}</code>
					<button type="button" class="tiny" onclick={copyShareToken}>
						{shareCopied ? '✓ Kopiert' : 'Kopieren'}
					</button>
				</div>
			{/if}

			{#if draft.publishedTo.length > 0}
				<div class="published-row">
					<span class="published-label">📤 Veröffentlicht:</span>
					{#each draft.publishedTo as target (`${target.module}:${target.targetId}`)}
						<span class="published-chip" title={formatDateTime(new Date(target.publishedAt))}>
							{#if target.module === 'articles'}
								📚 <a href={`/articles/${target.targetId}`}>Artikel</a>
							{:else if target.module === 'website'}
								🌐 Website
							{:else if target.module === 'presi'}
								🎞 Präsi
							{:else if target.module === 'mail'}
								✉️ Mail
							{:else if target.module === 'social-relay'}
								💬 Social
							{:else}
								{target.module}
							{/if}
						</span>
					{/each}
				</div>
			{/if}
		</header>

		<section class="briefing-section">
			<button type="button" class="briefing-toggle" onclick={() => (briefingOpen = !briefingOpen)}>
				{briefingOpen ? '▾' : '▸'} Briefing
				{#if !briefingOpen}
					<span class="preview">{draft.briefing.topic}</span>
					{#if activeStyleName}
						<span class="style-chip" title="Aktiver Stil">🎨 {activeStyleName}</span>
					{/if}
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
									? 'Kompletten Text neu generieren — neue Version (⌘G)'
									: 'Ersten Entwurf aus dem Briefing generieren (⌘G)'}
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
								title="Aktuellen Text als neue Version einfrieren (⌘⇧S)"
							>
								{saving ? 'Speichert…' : '＋ Checkpoint'}
							</button>
							<ExportMenu {draft} {currentVersion} />
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
					{#if activeSelection && !refinement}
						<SelectionToolbar
							selectionText={activeSelection.text}
							ontool={(invocation) => activeSelection && runRefinement(invocation, activeSelection)}
						/>
					{/if}
					{#if refinement}
						<RefinementPanel
							state={refinement}
							onaccept={acceptRefinement}
							onretry={retryRefinement}
							oncancel={cancelRefinement}
						/>
					{/if}
					{#if refineUndo && !refinement}
						<div class="undo-row">
							<button
								type="button"
								class="undo-btn"
								onclick={undoLastRefinement}
								title="Letzte Auswahl-Verfeinerung rückgängig (⌘Z)"
							>
								↶ Rückgängig: {refineUndo.label}
							</button>
						</div>
					{/if}
					<VersionEditor
						version={currentVersion}
						{targetWords}
						forceContent={forceEditorContent}
						onselect={(sel) => (activeSelection = sel)}
					/>
				{:else}
					<p class="muted">Diese Version existiert nicht mehr.</p>
				{/if}
			</section>

			<aside class="history-column">
				<h2>Versionen</h2>
				<VersionHistory
					versions={versions ?? []}
					generations={generations ?? []}
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
	.visibility-slot {
		margin-left: auto;
	}
	.share-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(0, 0, 0, 0.02));
		font-size: 0.8rem;
	}
	.share-label {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.share-token {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.75rem;
		padding: 0.15rem 0.4rem;
		border-radius: 0.3rem;
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.05));
		word-break: break-all;
	}
	.published-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.published-label {
		font-size: 0.75rem;
	}
	.published-chip {
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, #22c55e 10%, transparent);
		color: #16a34a;
		border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
		font-size: 0.75rem;
	}
	.published-chip a {
		color: inherit;
		text-decoration: underline;
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
	.style-chip {
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, #0ea5e9 10%, transparent);
		color: #0ea5e9;
		font-weight: normal;
		flex-shrink: 0;
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
	.undo-row {
		display: flex;
		justify-content: flex-end;
	}
	.undo-btn {
		padding: 0.35rem 0.8rem;
		border-radius: 0.45rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
	}
	.undo-btn:hover {
		border-color: #0ea5e9;
		color: #0ea5e9;
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

	/* ─── Print / PDF — triggered by ExportMenu's window.print() ────
	   The screen layout (.shell + the rest of the SvelteKit app shell)
	   is hidden; only .print-target stays visible so the PDF reads
	   like a manuscript: serif body, full-width prose, no chrome.
	   `:global(...)` reaches through component boundaries to suppress
	   the route page + workbench wrapping that the user can't see
	   from inside this file. */
	.print-target {
		display: none;
	}
	@media print {
		:global(body > *) {
			visibility: hidden;
		}
		.print-target,
		.print-target * {
			visibility: visible;
		}
		.print-target {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			padding: 0;
			margin: 0;
			background: white;
			color: black;
			font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
		}
		.print-title {
			font-size: 1.8rem;
			line-height: 1.2;
			margin: 0 0 1.5rem;
			font-weight: 600;
		}
		.print-body {
			white-space: pre-wrap;
			font-size: 1.05rem;
			line-height: 1.65;
		}
		@page {
			margin: 2cm;
		}
		.shell,
		.empty {
			display: none !important;
		}
	}
</style>
