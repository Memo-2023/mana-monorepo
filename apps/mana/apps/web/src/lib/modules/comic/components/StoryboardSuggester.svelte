<!--
  StoryboardSuggester — the M4 multi-step flow:

    1. Pick source  (ReferenceInputPicker)
    2. Choose panel count + submit to /comic/storyboard
    3. Review / edit the suggested Panel[] list
    4. Fire parallel generation — same batch executor as M3, plus
       `panelMeta[imageId].sourceInput = {module, entryId}` on each
       generated panel so the "Comics zu diesem Eintrag"-back-query
       (useStoriesByInput) resolves later.

  Unlike BatchPanelEditor this editor doesn't let the user author
  panels from scratch — they start with a Claude suggestion and tune.
  That's the value-add of M4: text in → panels out, author as editor
  not author-from-scratch.
-->
<script lang="ts">
	import {
		ArrowLeft,
		CheckCircle,
		Plus,
		Sparkle,
		SpinnerGap,
		Trash,
		WarningCircle,
		X,
	} from '@mana/shared-icons';
	import { runPanelGenerate, type PanelSize } from '../api/generate-panel';
	import {
		suggestPanels,
		type StoryboardSourceModule,
		type StoryboardPanel,
	} from '../api/storyboard';
	import {
		DEFAULT_STORYBOARD_PANEL_COUNT,
		MAX_PANELS_PER_STORY,
		MAX_STORYBOARD_PANEL_COUNT,
		MIN_STORYBOARD_PANEL_COUNT,
		PANEL_COUNT_WARN_THRESHOLD,
	} from '../constants';
	import type { ComicStory } from '../types';
	import ReferenceInputPicker, { type ReferenceSelection } from './ReferenceInputPicker.svelte';

	interface Props {
		story: ComicStory;
		onClose: () => void;
	}

	let { story, onClose }: Props = $props();

	type Step = 'pick-source' | 'generating-plan' | 'review-plan' | 'rendering';

	let step = $state<Step>('pick-source');
	let selection = $state<ReferenceSelection | null>(null);
	let requestedCount = $state(DEFAULT_STORYBOARD_PANEL_COUNT);
	let planError = $state<string | null>(null);

	interface PlanRow extends StoryboardPanel {
		id: string;
	}

	let rows = $state<PlanRow[]>([]);

	type Quality = 'low' | 'medium' | 'high';
	const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'] as const;
	const CREDIT_COST: Record<Quality, number> = { low: 3, medium: 10, high: 25 };
	let quality = $state<Quality>('medium');
	// svelte-ignore state_referenced_locally
	let size = $state<PanelSize>(story.style === 'webtoon' ? '1024x1536' : '1024x1024');

	type RowStatus = 'idle' | 'pending' | 'ok' | 'error';
	let rowStatus = $state<Record<string, { status: RowStatus; error?: string }>>({});
	let renderBusy = $state(false);

	const panelCount = $derived(story.panelImageIds.length);
	const roomLeft = $derived(Math.max(0, MAX_PANELS_PER_STORY - panelCount));
	const filledRows = $derived(rows.filter((r) => r.prompt.trim().length > 0));
	const effectiveCount = $derived(Math.min(filledRows.length, roomLeft));
	const warn = $derived(
		panelCount + effectiveCount >= PANEL_COUNT_WARN_THRESHOLD &&
			panelCount + effectiveCount <= MAX_PANELS_PER_STORY
	);

	const totalCost = $derived(CREDIT_COST[quality] * effectiveCount);

	async function handleSelect(sel: ReferenceSelection) {
		selection = sel;
		step = 'generating-plan';
		planError = null;
		try {
			const result = await suggestPanels({
				style: story.style,
				sourceText: sel.sourceText,
				panelCount: requestedCount,
				storyContext: story.storyContext,
				sourceModule: sel.module as StoryboardSourceModule,
			});
			rows = result.panels.map((p) => ({ ...p, id: crypto.randomUUID() }));
			step = 'review-plan';
		} catch (err) {
			planError = err instanceof Error ? err.message : 'Unbekannter Fehler';
			step = 'pick-source';
		}
	}

	function removeRow(id: string) {
		if (rows.length <= 1) return;
		rows = rows.filter((r) => r.id !== id);
	}

	function addRow() {
		rows.push({ id: crypto.randomUUID(), prompt: '', caption: undefined, dialogue: undefined });
	}

	async function submitRow(row: PlanRow): Promise<string | null> {
		if (!selection) return null;
		rowStatus[row.id] = { status: 'pending' };
		try {
			const result = await runPanelGenerate({
				story,
				panelPrompt: row.prompt,
				caption: row.caption?.trim() || undefined,
				dialogue: row.dialogue?.trim() || undefined,
				quality,
				size,
				sourceInput: {
					module: selection.module,
					entryId: selection.entryId,
				},
			});
			rowStatus[row.id] = { status: 'ok' };
			return result.imageId;
		} catch (err) {
			rowStatus[row.id] = {
				status: 'error',
				error: err instanceof Error ? err.message : 'Unbekannter Fehler',
			};
			return null;
		}
	}

	async function handleRender() {
		if (renderBusy || filledRows.length === 0) return;
		renderBusy = true;
		step = 'rendering';
		rowStatus = {};
		const effectiveRows = filledRows.slice(0, roomLeft);
		await Promise.allSettled(effectiveRows.map((r) => submitRow(r)));
		renderBusy = false;
		// Close the flow once everything succeeded. If any row failed the
		// user stays in the review step with per-row retry chips.
		const anyError = Object.values(rowStatus).some((s) => s.status === 'error');
		if (!anyError) {
			onClose();
		} else {
			step = 'review-plan';
		}
	}

	async function retryRow(row: PlanRow) {
		if (renderBusy) return;
		renderBusy = true;
		await submitRow(row);
		renderBusy = false;
	}

	function resetToSource() {
		step = 'pick-source';
		rows = [];
		rowStatus = {};
		selection = null;
		planError = null;
	}
</script>

<div class="rounded-2xl border border-border bg-card p-4 sm:p-5">
	<header class="mb-3 flex items-start justify-between gap-3">
		<div>
			<h3 class="flex items-center gap-1.5 text-sm font-semibold text-foreground">
				<Sparkle size={14} class="text-primary" />
				Mit KI aus Text generieren
			</h3>
			<p class="text-xs text-muted-foreground">
				{#if step === 'pick-source'}
					Schritt 1 · Quelle auswählen
				{:else if step === 'generating-plan'}
					Schritt 2 · Panels werden vorgeschlagen…
				{:else if step === 'review-plan'}
					Schritt 3 · Vorschläge prüfen und generieren
				{:else}
					Schritt 4 · Panels werden gerendert…
				{/if}
			</p>
		</div>
		<button
			type="button"
			onclick={onClose}
			class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-label="KI-Flow schließen"
		>
			<X size={14} />
		</button>
	</header>

	{#if step === 'pick-source'}
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<label
					for="panel-count"
					class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
				>
					Panel-Anzahl:
				</label>
				<input
					id="panel-count"
					type="number"
					min={MIN_STORYBOARD_PANEL_COUNT}
					max={MAX_STORYBOARD_PANEL_COUNT}
					bind:value={requestedCount}
					class="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
				/>
				<span class="text-xs text-muted-foreground">
					({MIN_STORYBOARD_PANEL_COUNT}–{MAX_STORYBOARD_PANEL_COUNT})
				</span>
			</div>

			{#if planError}
				<div
					class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
					role="alert"
				>
					{planError}
				</div>
			{/if}

			<ReferenceInputPicker onSelect={handleSelect} />
		</div>
	{:else if step === 'generating-plan'}
		<div class="flex items-center justify-center gap-3 py-8" role="status" aria-live="polite">
			<SpinnerGap size={20} class="spinner text-primary" weight="bold" />
			<p class="text-sm text-muted-foreground">
				Das Modell denkt über deine {requestedCount} Panels nach…
			</p>
		</div>
	{:else if step === 'review-plan' || step === 'rendering'}
		<div class="space-y-3">
			{#if selection}
				<div
					class="flex items-start justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
				>
					<div class="min-w-0">
						<p class="font-medium text-foreground">
							Quelle: {selection.label}
						</p>
						<p class="text-[11px] capitalize text-muted-foreground">{selection.module}</p>
					</div>
					{#if !renderBusy}
						<button
							type="button"
							onclick={resetToSource}
							class="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
						>
							<ArrowLeft size={10} />
							Andere Quelle
						</button>
					{/if}
				</div>
			{/if}

			{#if warn && !renderBusy}
				<p class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
					Hinweis: Ab ~{PANEL_COUNT_WARN_THRESHOLD} Panels wird Character-Konsistenz spürbar schwerer.
				</p>
			{/if}

			{#if roomLeft < rows.length}
				<div
					class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
					role="alert"
				>
					Nur {roomLeft} Slot{roomLeft === 1 ? '' : 's'} frei in dieser Story — die letzten {rows.length -
						roomLeft} Vorschläge werden nicht gerendert.
				</div>
			{/if}

			<div class="space-y-2">
				{#each rows as row, index (row.id)}
					{@const status = rowStatus[row.id]}
					{@const overRoom = index >= roomLeft}
					<div
						class="rounded-lg border border-border bg-background p-3"
						class:opacity-50={overRoom}
					>
						<div class="mb-2 flex items-center justify-between gap-2">
							<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
								<span
									class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-foreground"
								>
									{panelCount + index + 1}
								</span>
								<span>Panel {index + 1}</span>
								{#if status?.status === 'pending'}
									<span
										class="inline-flex items-center gap-1 text-primary"
										role="status"
										aria-live="polite"
									>
										<SpinnerGap size={12} class="spinner" weight="bold" />
										Wird generiert…
									</span>
								{:else if status?.status === 'ok'}
									<span class="inline-flex items-center gap-1 text-primary">
										<CheckCircle size={12} weight="fill" />
										Fertig
									</span>
								{:else if status?.status === 'error'}
									<span class="inline-flex items-center gap-1 text-error">
										<WarningCircle size={12} weight="fill" />
										Fehlgeschlagen
									</span>
								{/if}
							</div>
							<div class="flex items-center gap-1">
								{#if status?.status === 'error'}
									<button
										type="button"
										onclick={() => retryRow(row)}
										disabled={renderBusy}
										class="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
									>
										Neu versuchen
									</button>
								{/if}
								{#if rows.length > 1 && !renderBusy}
									<button
										type="button"
										onclick={() => removeRow(row.id)}
										class="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-error"
										aria-label="Vorschlag entfernen"
									>
										<Trash size={12} />
									</button>
								{/if}
							</div>
						</div>

						<textarea
							bind:value={row.prompt}
							rows={2}
							placeholder="Prompt — was passiert im Panel?"
							maxlength={600}
							class="block w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
							disabled={renderBusy}
						></textarea>

						<div class="mt-2 grid gap-2 sm:grid-cols-2">
							<input
								type="text"
								bind:value={row.caption}
								placeholder="Caption (optional)"
								maxlength={120}
								class="block w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
								disabled={renderBusy}
							/>
							<input
								type="text"
								bind:value={row.dialogue}
								placeholder="Dialog (optional)"
								maxlength={120}
								class="block w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
								disabled={renderBusy}
							/>
						</div>

						{#if status?.status === 'error' && status.error}
							<p class="mt-2 text-[11px] text-error" role="alert">{status.error}</p>
						{/if}
					</div>
				{/each}
			</div>

			{#if !renderBusy}
				<button
					type="button"
					onclick={addRow}
					disabled={rows.length >= MAX_PANELS_PER_STORY}
					class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Plus size={12} />
					Weiteres Panel manuell
				</button>
			{/if}

			<div class="flex flex-wrap items-center gap-3 border-t border-border pt-3">
				<div class="flex items-center gap-1.5">
					<span class="text-[11px] font-medium text-muted-foreground">Qualität:</span>
					{#each QUALITIES as q (q)}
						<button
							type="button"
							onclick={() => (quality = q)}
							class="rounded-md border px-2 py-0.5 text-[11px] transition-colors
								{quality === q
								? 'border-primary bg-primary/10 text-foreground'
								: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
							disabled={renderBusy}
							aria-pressed={quality === q}
						>
							{q} ({CREDIT_COST[q]}c)
						</button>
					{/each}
				</div>
				<div class="flex items-center gap-1.5">
					<span class="text-[11px] font-medium text-muted-foreground">Format:</span>
					<button
						type="button"
						onclick={() => (size = '1024x1024')}
						class="rounded-md border px-2 py-0.5 text-[11px] transition-colors
							{size === '1024x1024'
							? 'border-primary bg-primary/10 text-foreground'
							: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
						disabled={renderBusy}
						aria-pressed={size === '1024x1024'}
					>
						Quadrat
					</button>
					<button
						type="button"
						onclick={() => (size = '1024x1536')}
						class="rounded-md border px-2 py-0.5 text-[11px] transition-colors
							{size === '1024x1536'
							? 'border-primary bg-primary/10 text-foreground'
							: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
						disabled={renderBusy}
						aria-pressed={size === '1024x1536'}
					>
						Hoch
					</button>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleRender}
					disabled={renderBusy || effectiveCount === 0}
					class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if renderBusy}
						<SpinnerGap size={14} class="spinner" weight="bold" />
						{effectiveCount}
						{effectiveCount === 1 ? 'Panel' : 'Panels'} werden generiert…
					{:else}
						<Sparkle size={14} />
						{effectiveCount}
						{effectiveCount === 1 ? 'Panel' : 'Panels'} generieren ({totalCost}c)
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.spinner) {
		animation: panel-spin 0.9s linear infinite;
	}
	@keyframes panel-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
