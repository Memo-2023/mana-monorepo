<!--
  BatchPanelEditor — compose 2..N panels in one go. All entries share
  the story's style prefix + character refs; the user writes the
  per-panel prompt/caption/dialog in stacked cards. On submit we fire
  parallel `runPanelGenerate()` calls via `Promise.allSettled` so one
  failure doesn't block the others, and render per-panel progress +
  retry chips below the form.

  The batch executor is a thin layer on top of the M2 single-panel
  flow: each row goes through the identical HTTP path, appendPanel,
  and picture.images write, so there's no divergence between single
  and batch outputs.

  Plan: docs/plans/comic-module.md M3.
-->
<script lang="ts">
	import {
		CheckCircle,
		Plus,
		Sparkle,
		SpinnerGap,
		Trash,
		WarningCircle,
		X,
	} from '@mana/shared-icons';
	import {
		runPanelGenerate,
		DEFAULT_PANEL_MODEL,
		type PanelModel,
		type PanelSize,
	} from '../api/generate-panel';
	import { MAX_PANELS_PER_STORY, PANEL_COUNT_WARN_THRESHOLD } from '../constants';
	import type { ComicStory } from '../types';
	import PanelModelPicker from './PanelModelPicker.svelte';

	interface Props {
		story: ComicStory;
		onClose: () => void;
		onGenerated?: (panelIds: string[]) => void;
	}

	let { story, onClose, onGenerated }: Props = $props();

	type Quality = 'low' | 'medium' | 'high';
	const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'] as const;
	const CREDIT_COST: Record<Quality, number> = { low: 3, medium: 10, high: 25 };

	// Max entries per batch — plan cap. N=4 balances "write a short comic
	// in one sitting" against "one failure takes out too many credits".
	const MAX_BATCH = 4;

	interface Row {
		id: string;
		prompt: string;
		caption: string;
		dialogue: string;
	}

	function emptyRow(): Row {
		return { id: crypto.randomUUID(), prompt: '', caption: '', dialogue: '' };
	}

	let rows = $state<Row[]>([emptyRow(), emptyRow()]);
	let quality = $state<Quality>('medium');
	let model = $state<PanelModel>(DEFAULT_PANEL_MODEL);
	// svelte-ignore state_referenced_locally
	let size = $state<PanelSize>(story.style === 'webtoon' ? '1024x1536' : '1024x1024');

	// Per-row execution state — mirrors `rows` by id so we can render
	// chips during/after submit without touching the input fields.
	type RowStatus = 'idle' | 'pending' | 'ok' | 'error';
	let rowStatus = $state<Record<string, { status: RowStatus; error?: string }>>({});

	let submitting = $state(false);

	const panelCount = $derived(story.panelImageIds.length);
	const roomLeft = $derived(Math.max(0, MAX_PANELS_PER_STORY - panelCount));
	const effectiveRows = $derived(rows.slice(0, Math.min(MAX_BATCH, roomLeft)));

	const filledRows = $derived(effectiveRows.filter((r) => r.prompt.trim().length > 0));
	const canAdd = $derived(rows.length < MAX_BATCH && rows.length < roomLeft);
	const canSubmit = $derived(filledRows.length > 0 && !submitting && roomLeft > 0);

	const warn = $derived(
		panelCount + filledRows.length >= PANEL_COUNT_WARN_THRESHOLD &&
			panelCount + filledRows.length <= MAX_PANELS_PER_STORY
	);
	const atCap = $derived(roomLeft === 0);

	const totalCost = $derived(CREDIT_COST[quality] * filledRows.length);

	function addRow() {
		if (!canAdd) return;
		rows.push(emptyRow());
	}

	function removeRow(id: string) {
		if (rows.length <= 1) return;
		rows = rows.filter((r) => r.id !== id);
		delete rowStatus[id];
	}

	async function submitRow(row: Row): Promise<string | null> {
		rowStatus[row.id] = { status: 'pending' };
		try {
			const result = await runPanelGenerate({
				story,
				panelPrompt: row.prompt,
				caption: row.caption.trim() || undefined,
				dialogue: row.dialogue.trim() || undefined,
				quality,
				size,
				model,
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

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		submitting = true;

		// Re-init status so a retry-submit doesn't leak old chip state.
		rowStatus = {};

		// Promise.allSettled preserves each row's outcome independently —
		// a 402 Credits-Error on row 2 won't cancel rows 3+4. The story's
		// `panelImageIds` grows in whatever order the calls resolve; the
		// user can manually reorder panels in M5+ if needed.
		const submissions = filledRows.map((r) => submitRow(r));
		const results = await Promise.allSettled(submissions);

		submitting = false;

		const successfulIds = results
			.map((r) => (r.status === 'fulfilled' ? r.value : null))
			.filter((id): id is string => id !== null);

		onGenerated?.(successfulIds);

		// Clear successful rows so the user can type the next batch
		// without them reappearing; keep failed rows filled for retry.
		const failedIds = Object.entries(rowStatus)
			.filter(([, s]) => s.status === 'error')
			.map(([id]) => id);
		if (failedIds.length === 0) {
			rows = [emptyRow(), emptyRow()];
			rowStatus = {};
		} else {
			rows = rows.filter((r) => failedIds.includes(r.id));
		}
	}

	async function retryRow(row: Row) {
		if (submitting) return;
		submitting = true;
		await submitRow(row);
		submitting = false;
		if (rowStatus[row.id]?.status === 'ok') {
			// Strip successful row out.
			rows = rows.filter((r) => r.id !== row.id);
			delete rowStatus[row.id];
		}
	}
</script>

<div class="rounded-2xl border border-border bg-card p-4 sm:p-5">
	<header class="mb-3 flex items-start justify-between gap-3">
		<div>
			<h3 class="text-sm font-semibold text-foreground">Batch-Panels</h3>
			<p class="text-xs text-muted-foreground">
				{filledRows.length}
				{filledRows.length === 1 ? 'Panel' : 'Panels'} · {story.characterMediaIds.length} Referenz{story
					.characterMediaIds.length === 1
					? ''
					: 'en'} · {roomLeft}
				{roomLeft === 1 ? 'Slot' : 'Slots'} frei
			</p>
		</div>
		<button
			type="button"
			onclick={onClose}
			class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-label="Batch-Editor schließen"
		>
			<X size={14} />
		</button>
	</header>

	{#if atCap}
		<div
			class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
			role="alert"
		>
			Die Story ist am {MAX_PANELS_PER_STORY}-Panel-Limit. Entferne ältere Panels oder lege eine
			neue Story an.
		</div>
	{:else if warn}
		<p class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
			Hinweis: Ab ~{PANEL_COUNT_WARN_THRESHOLD} Panels wird Character-Konsistenz spürbar schwerer.
		</p>
	{/if}

	<form
		onsubmit={handleSubmit}
		class="mt-3 space-y-3"
		class:pointer-events-none={atCap}
		class:opacity-60={atCap}
	>
		<div class="space-y-2">
			{#each effectiveRows as row, index (row.id)}
				{@const status = rowStatus[row.id]}
				<div class="rounded-lg border border-border bg-background p-3">
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
									disabled={submitting}
									class="text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
								>
									Neu versuchen
								</button>
							{/if}
							{#if rows.length > 1}
								<button
									type="button"
									onclick={() => removeRow(row.id)}
									disabled={submitting}
									class="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-error disabled:opacity-50"
									aria-label="Zeile entfernen"
								>
									<Trash size={12} />
								</button>
							{/if}
						</div>
					</div>

					<textarea
						bind:value={row.prompt}
						rows={2}
						placeholder="Was passiert in diesem Panel?"
						maxlength={600}
						class="block w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
						disabled={submitting || atCap}
					></textarea>

					<div class="mt-2 grid gap-2 sm:grid-cols-2">
						<input
							type="text"
							bind:value={row.caption}
							placeholder="Caption (optional)"
							maxlength={120}
							class="block w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
							disabled={submitting || atCap}
						/>
						<input
							type="text"
							bind:value={row.dialogue}
							placeholder="Dialog (optional)"
							maxlength={120}
							class="block w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
							disabled={submitting || atCap}
						/>
					</div>

					{#if status?.status === 'error' && status.error}
						<p class="mt-2 text-[11px] text-error" role="alert">{status.error}</p>
					{/if}
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={addRow}
				disabled={!canAdd || submitting}
				class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Plus size={12} />
				Weiteres Panel ({rows.length}/{Math.min(MAX_BATCH, roomLeft)})
			</button>
		</div>

		<PanelModelPicker value={model} onChange={(m) => (model = m)} disabled={submitting} />

		<div class="flex flex-wrap items-center gap-3">
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
						disabled={submitting}
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
					disabled={submitting}
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
					disabled={submitting}
					aria-pressed={size === '1024x1536'}
				>
					Hoch
				</button>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="submit"
				disabled={!canSubmit}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if submitting}
					<SpinnerGap size={14} class="spinner" weight="bold" />
					{filledRows.length}
					{filledRows.length === 1 ? 'Panel' : 'Panels'} werden generiert…
				{:else}
					<Sparkle size={14} />
					{filledRows.length}
					{filledRows.length === 1 ? 'Panel' : 'Panels'} generieren ({totalCost}c)
				{/if}
			</button>
		</div>
	</form>
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
