<!--
  BriefingForm — create a new draft or edit an existing draft's briefing.
  In M2 this is the only way a draft comes into existence. M3+ will add a
  one-field "what do you want to write?" shortcut that proposes a briefing,
  but the full form remains the canonical source-of-truth view.
-->
<script lang="ts">
	import { KIND_LABELS, TONE_PRESETS, LENGTH_PRESETS, DEFAULT_LANGUAGE } from '../constants';
	import { draftsStore } from '../stores/drafts.svelte';
	import type { Draft, DraftKind, DraftBriefing } from '../types';

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

	let saving = $state(false);
	let error = $state<string | null>(null);

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
				});
				oncreated?.(created);
			} else if (draft) {
				await draftsStore.updateDraft(draft.id, {
					title: title.trim(),
					kind,
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
			<!-- svelte-ignore a11y_autofocus -->
			<input type="text" bind:value={title} placeholder="Mein Blogpost über …" required autofocus />
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
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
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
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
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
		outline: 2px solid #0ea5e9;
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
		background: #0ea5e9;
		color: white;
		border: 1px solid #0ea5e9;
	}
	.primary:hover:not(:disabled) {
		background: #0284c7;
		border-color: #0284c7;
	}
	.secondary {
		background: transparent;
		color: var(--color-text, inherit);
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
	}
	.secondary:hover:not(:disabled) {
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
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
