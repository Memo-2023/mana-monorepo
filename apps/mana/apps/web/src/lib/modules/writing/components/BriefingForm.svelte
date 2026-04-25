<!--
  BriefingForm — create a new draft or edit an existing draft's briefing.
  In M2 this is the only way a draft comes into existence. M3+ will add a
  one-field "what do you want to write?" shortcut that proposes a briefing,
  but the full form remains the canonical source-of-truth view.
-->
<script lang="ts">
	import { KIND_LABELS, TONE_PRESETS, LENGTH_PRESETS, DEFAULT_LANGUAGE } from '../constants';
	import { draftsStore } from '../stores/drafts.svelte';
	import { callWritingGeneration } from '../api';
	import { buildTitleSuggestionPrompt, cleanSuggestedTitle } from '../utils/prompt-builder';
	import { useCurrentVersionForDraft } from '../queries';
	import StylePicker from './StylePicker.svelte';
	import ReferencePicker from './ReferencePicker.svelte';
	import type { Draft, DraftKind, DraftBriefing, DraftReference } from '../types';

	let {
		mode,
		draft,
		initialKind,
		onclose,
		oncreated,
	}: {
		mode: 'create' | 'edit';
		draft?: Draft;
		initialKind?: DraftKind;
		onclose: () => void;
		oncreated?: (draft: Draft) => void;
	} = $props();

	const KIND_ORDER: DraftKind[] = [
		'blog',
		'essay',
		'email',
		'social',
		'story',
		'letter',
		'speech',
		'cover-letter',
		'product-description',
		'press-release',
		'bio',
		'other',
	];

	// Form state is seeded once from `draft` / `initialKind`; it never
	// re-syncs because the form gets a fresh mount every time it opens.
	// The svelte-ignore comments silence the (correct-in-general) warning.
	/* svelte-ignore state_referenced_locally */
	let title = $state(draft?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let kind = $state<DraftKind>(draft?.kind ?? initialKind ?? 'blog');
	/* svelte-ignore state_referenced_locally */
	let topic = $state(draft?.briefing.topic ?? '');
	/* svelte-ignore state_referenced_locally */
	let audience = $state(draft?.briefing.audience ?? '');
	/* svelte-ignore state_referenced_locally */
	let tone = $state(draft?.briefing.tone ?? '');
	/* svelte-ignore state_referenced_locally */
	let language = $state(draft?.briefing.language ?? DEFAULT_LANGUAGE);
	/* svelte-ignore state_referenced_locally */
	let targetLengthValue = $state<number>(
		draft?.briefing.targetLength?.value ?? LENGTH_PRESETS[draft?.kind ?? 'blog'].value
	);
	/* svelte-ignore state_referenced_locally */
	let extraInstructions = $state(draft?.briefing.extraInstructions ?? '');
	/* svelte-ignore state_referenced_locally */
	let styleId = $state<string | null>(draft?.styleId ?? null);
	/* svelte-ignore state_referenced_locally */
	let references = $state<DraftReference[]>([...(draft?.references ?? [])]);

	let saving = $state(false);
	let error = $state<string | null>(null);
	let suggestingTitle = $state(false);

	// In edit mode we can hand the model an excerpt of the current
	// version so the title hugs the actual prose, not just the briefing.
	// In create mode there's nothing to excerpt yet.
	/* svelte-ignore state_referenced_locally */
	const currentVersion$ = draft ? useCurrentVersionForDraft(draft.id) : null;
	const currentExcerpt = $derived.by<string | undefined>(() => {
		const content = currentVersion$?.value?.content;
		if (!content) return undefined;
		return content.length > 800 ? content.slice(0, 800) + '…' : content;
	});

	async function suggestTitle() {
		if (suggestingTitle) return;
		const trimmedTopic = topic.trim();
		if (!trimmedTopic) {
			error = 'Bitte erst ein Thema eingeben — der Vorschlag braucht Kontext.';
			return;
		}
		suggestingTitle = true;
		error = null;
		try {
			const prompt = buildTitleSuggestionPrompt({
				kind,
				briefing: {
					topic: trimmedTopic,
					audience: audience.trim() || null,
					tone: tone.trim() || null,
					language,
					extraInstructions: extraInstructions.trim() || null,
				},
				excerpt: currentExcerpt,
			});
			const result = await callWritingGeneration({
				systemPrompt: prompt.system,
				userPrompt: prompt.user,
				kind: 'title-suggestion',
				temperature: 0.6,
				// Titles are 4–8 words; 60 tokens is enough headroom even
				// for a chatty model that adds whitespace.
				maxTokens: 60,
			});
			const cleaned = cleanSuggestedTitle(result.output);
			if (cleaned) title = cleaned;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			suggestingTitle = false;
		}
	}

	// When the user switches kind while creating a new draft, nudge the
	// target length to that kind's preset so they don't have to touch it.
	// On edit we leave existing custom values alone.
	/* svelte-ignore state_referenced_locally */
	let lastKindSeen = $state(kind);
	$effect(() => {
		if (mode !== 'create') return;
		if (kind === lastKindSeen) return;
		targetLengthValue = LENGTH_PRESETS[kind].value;
		lastKindSeen = kind;
	});

	const isValid = $derived(title.trim().length > 0 && topic.trim().length > 0);

	async function submit(ev: Event) {
		ev.preventDefault();
		if (!isValid || saving) return;
		saving = true;
		error = null;
		try {
			const briefing: Partial<DraftBriefing> & { topic: string } = {
				topic: topic.trim(),
				audience: audience.trim() || null,
				tone: tone.trim() || null,
				language,
				targetLength: { type: 'words', value: targetLengthValue },
				extraInstructions: extraInstructions.trim() || null,
			};
			if (mode === 'create') {
				const { draft: created } = await draftsStore.createDraft({
					kind,
					title: title.trim(),
					briefing,
					styleId,
					references,
				});
				oncreated?.(created);
			} else if (draft) {
				await draftsStore.updateDraft(draft.id, {
					title: title.trim(),
					kind,
					styleId,
					references,
				});
				await draftsStore.updateBriefing(draft.id, briefing);
			}
			onclose();
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			saving = false;
		}
	}
</script>

<form class="briefing" onsubmit={submit}>
	<div class="row">
		<label>
			<span>Titel</span>
			<div class="title-row">
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					bind:value={title}
					placeholder="Mein Blogpost über …"
					required
					autofocus
				/>
				<button
					type="button"
					class="suggest-btn"
					onclick={suggestTitle}
					disabled={suggestingTitle || !topic.trim()}
					title={topic.trim() ? 'Titel aus Briefing + Inhalt vorschlagen' : 'Erst Thema ausfüllen'}
				>
					{suggestingTitle ? '…' : '✨'}
				</button>
			</div>
		</label>
		<label class="kind-select">
			<span>Textart</span>
			<select bind:value={kind}>
				{#each KIND_ORDER as k (k)}
					<option value={k}>
						{KIND_LABELS[k].emoji}
						{KIND_LABELS[k].de}
					</option>
				{/each}
			</select>
		</label>
	</div>

	<label>
		<span>Worum geht's? <small>(wird als Kern-Briefing an die KI übergeben)</small></span>
		<textarea
			bind:value={topic}
			rows="3"
			placeholder="z.B. 'Was Mana von klassischen Produktivitätstools unterscheidet, aus Nutzersicht'"
			required
		></textarea>
	</label>

	<div class="row">
		<label>
			<span>Zielgruppe</span>
			<input type="text" bind:value={audience} placeholder="z.B. Gründer, Eltern, …" />
		</label>
		<label>
			<span>Ton</span>
			<select bind:value={tone}>
				<option value="">— kein fester Ton —</option>
				{#each TONE_PRESETS as preset (preset.id)}
					<option value={preset.id}>{preset.de}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="row">
		<label>
			<span>Länge (Wörter)</span>
			<input type="number" min="20" max="20000" step="20" bind:value={targetLengthValue} />
		</label>
		<label>
			<span>Sprache</span>
			<select bind:value={language}>
				<option value="de">Deutsch</option>
				<option value="en">English</option>
				<option value="fr">Français</option>
				<option value="es">Español</option>
				<option value="it">Italiano</option>
			</select>
		</label>
	</div>

	<label>
		<span>
			Stil <small>(optional — prägt Ton & Struktur der Generation)</small>
		</span>
		<StylePicker value={styleId} onchange={(next) => (styleId = next)} />
	</label>

	<div class="references-field">
		<span class="field-label">
			Quellen <small>(optional — flowen als Kontext in den Prompt ein)</small>
		</span>
		<ReferencePicker {references} onchange={(next) => (references = next)} />
	</div>

	<label>
		<span>Zusatzhinweise <small>(optional)</small></span>
		<textarea
			bind:value={extraInstructions}
			rows="2"
			placeholder="z.B. 'keine Buzzwords', 'mit einem Zitat beginnen', …"
		></textarea>
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={onclose} disabled={saving}> Abbrechen </button>
		<button type="submit" class="primary" disabled={!isValid || saving}>
			{#if saving}
				Speichert…
			{:else if mode === 'create'}
				Draft anlegen
			{:else}
				Speichern
			{/if}
		</button>
	</div>
</form>

<style>
	.briefing {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem 1.25rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
	}
	label > span {
		color: hsl(var(--color-muted-foreground));
	}
	.references-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
	}
	.field-label {
		color: hsl(var(--color-muted-foreground));
	}
	.title-row {
		display: flex;
		gap: 0.4rem;
		align-items: stretch;
	}
	.title-row input {
		flex: 1;
		min-width: 0;
	}
	.suggest-btn {
		flex-shrink: 0;
		padding: 0 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		cursor: pointer;
		font: inherit;
		font-size: 1rem;
		color: inherit;
	}
	.suggest-btn:hover:not(:disabled) {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}
	.suggest-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	small {
		font-weight: normal;
		opacity: 0.7;
	}
	input,
	select,
	textarea {
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font: inherit;
		color: inherit;
	}
	textarea {
		resize: vertical;
		min-height: 3rem;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		border-color: transparent;
	}
	.kind-select {
		max-width: 220px;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}
	button {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.primary {
		background: hsl(var(--color-primary));
		color: white;
		border: 1px solid hsl(var(--color-primary));
	}
	.primary:hover:not(:disabled) {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.secondary {
		background: transparent;
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}
	.secondary:hover:not(:disabled) {
		background: hsl(var(--color-surface));
	}
	.error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0;
	}

	@media (max-width: 600px) {
		.row {
			grid-template-columns: 1fr;
		}
		.kind-select {
			max-width: none;
		}
	}
</style>
