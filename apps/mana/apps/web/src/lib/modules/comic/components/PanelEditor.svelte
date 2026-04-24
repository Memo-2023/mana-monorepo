<!--
  PanelEditor — inline "new panel" sheet. Three textareas (prompt,
  caption, dialogue) plus a quality toggle and the Generieren button.
  On submit, runPanelGenerate fires the API call and appends the new
  panel to the story; on error the sheet stays mounted so the user
  can adjust without retyping.

  Prompt and the optional caption/dialogue get composed with the
  story-wide style prefix inside `composePanelPrompt` before the call
  — the user doesn't repeat style instructions per panel.

  M2 scope: single panel per click. Batch-mode (n panels in one submit)
  is M3 via the plan.
-->
<script lang="ts">
	import { Sparkle, SpinnerGap, X } from '@mana/shared-icons';
	import { runPanelGenerate, type PanelSize } from '../api/generate-panel';
	import { MAX_PANELS_PER_STORY, PANEL_COUNT_WARN_THRESHOLD } from '../constants';
	import type { ComicStory } from '../types';

	interface Props {
		story: ComicStory;
		onClose: () => void;
		onGenerated?: (panelId: string) => void;
	}

	let { story, onClose, onGenerated }: Props = $props();

	let panelPrompt = $state('');
	let caption = $state('');
	let dialogue = $state('');
	let quality = $state<'low' | 'medium' | 'high'>('medium');
	// Size defaults based on the story's style at mount time — users
	// can flip the toggle per panel afterwards, so capturing the
	// initial value is intentional here.
	// svelte-ignore state_referenced_locally
	let size = $state<PanelSize>(story.style === 'webtoon' ? '1024x1536' : '1024x1024');

	let submitting = $state(false);
	let errorMsg = $state<string | null>(null);

	const panelCount = $derived(story.panelImageIds.length);
	const atCap = $derived(panelCount >= MAX_PANELS_PER_STORY);
	const warn = $derived(panelCount >= PANEL_COUNT_WARN_THRESHOLD && !atCap);

	const canSubmit = $derived(panelPrompt.trim().length > 0 && !submitting && !atCap);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		submitting = true;
		errorMsg = null;
		try {
			const result = await runPanelGenerate({
				story,
				panelPrompt,
				caption: caption.trim() || undefined,
				dialogue: dialogue.trim() || undefined,
				quality,
				size,
			});
			onGenerated?.(result.imageId);
			// Reset local state so the next panel-add starts fresh.
			panelPrompt = '';
			caption = '';
			dialogue = '';
			submitting = false;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Panel-Generierung fehlgeschlagen';
			submitting = false;
		}
	}

	type Quality = 'low' | 'medium' | 'high';
	const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'] as const;
	const CREDIT_COST: Record<Quality, number> = {
		low: 3,
		medium: 10,
		high: 25,
	};
</script>

<div class="rounded-2xl border border-border bg-card p-4 sm:p-5">
	<header class="mb-3 flex items-center justify-between">
		<div>
			<h3 class="text-sm font-semibold text-foreground">Neues Panel</h3>
			<p class="text-xs text-muted-foreground">
				Panel {panelCount + 1} · nutzt {story.characterMediaIds.length} Referenz{story
					.characterMediaIds.length === 1
					? ''
					: 'en'}
			</p>
		</div>
		<button
			type="button"
			onclick={onClose}
			class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-label="Panel-Editor schließen"
		>
			<X size={14} />
		</button>
	</header>

	{#if atCap}
		<div
			class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
			role="alert"
		>
			Hart-Limit von {MAX_PANELS_PER_STORY} Panels erreicht. Ältere Panels entfernen oder neue Story anlegen.
		</div>
	{:else if warn}
		<p class="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
			Hinweis: Ab ~{PANEL_COUNT_WARN_THRESHOLD} Panels wird Character-Konsistenz mit gpt-image-2 spürbar
			schwerer.
		</p>
	{/if}

	<form
		onsubmit={handleSubmit}
		class="mt-3 space-y-3"
		class:pointer-events-none={atCap}
		class:opacity-60={atCap}
	>
		<div class="space-y-1.5">
			<label
				for="panel-prompt"
				class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
			>
				Panel-Prompt
			</label>
			<textarea
				id="panel-prompt"
				bind:value={panelPrompt}
				rows={3}
				placeholder="Was passiert in diesem Panel? z.B. 'Protagonist sitzt am Schreibtisch, starrt auf Monitor mit rotem X'"
				maxlength={600}
				class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
				disabled={submitting || atCap}
				required
			></textarea>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<div class="space-y-1.5">
				<label
					for="panel-caption"
					class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
				>
					Caption <span class="font-normal normal-case text-muted-foreground">(optional)</span>
				</label>
				<input
					id="panel-caption"
					type="text"
					bind:value={caption}
					placeholder="Montag, 9 Uhr."
					maxlength={120}
					class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					disabled={submitting || atCap}
				/>
			</div>
			<div class="space-y-1.5">
				<label
					for="panel-dialogue"
					class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
				>
					Dialog <span class="font-normal normal-case text-muted-foreground">(optional)</span>
				</label>
				<input
					id="panel-dialogue"
					type="text"
					bind:value={dialogue}
					placeholder="Schon wieder rot."
					maxlength={120}
					class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
					disabled={submitting || atCap}
				/>
			</div>
		</div>

		<p class="text-[11px] text-muted-foreground">
			Caption und Dialog werden direkt in das Bild gerendert. Englische Texte rendern stabiler als
			deutsche, kurze Sätze funktionieren am besten.
		</p>

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

		{#if errorMsg}
			<div
				class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
				role="alert"
			>
				{errorMsg}
			</div>
		{/if}

		<div class="flex items-center gap-2">
			<button
				type="submit"
				disabled={!canSubmit}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if submitting}
					<SpinnerGap size={14} class="spinner" weight="bold" />
					Generiert…
				{:else}
					<Sparkle size={14} />
					Panel generieren ({CREDIT_COST[quality]}c)
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
