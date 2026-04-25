<script lang="ts">
	import { augurStore } from '../stores/entries.svelte';
	import { useAllAugurEntries } from '../queries';
	import LivingOracleHint from './LivingOracleHint.svelte';
	import {
		KIND_LABELS,
		VIBE_LABELS,
		SOURCE_CATEGORY_LABELS,
		type AugurEntry,
		type AugurKind,
		type AugurVibe,
		type AugurSourceCategory,
	} from '../types';

	let {
		mode = 'create',
		initial,
		onclose,
	}: {
		mode?: 'create' | 'edit';
		initial?: AugurEntry;
		onclose?: () => void;
	} = $props();

	const history$ = useAllAugurEntries();
	const history = $derived(history$.value);
	let oracleReflection = $state<string | null>(null);

	const T = {
		kind: 'Art',
		source: 'Quelle',
		category: 'Kategorie',
		claim: 'Was sagt das Zeichen?',
		vibe: 'Stimmung',
		feltMeaning: 'Eigene Deutung (optional)',
		expectedOutcome: 'Was sollte konkret passieren? (optional)',
		expectedBy: 'Bis wann? (optional)',
		probability: 'Wahrscheinlichkeit (optional, 0-100%)',
		tags: 'Tags (komma-getrennt)',
		encounteredAt: 'Wann erlebt?',
		sourcePlaceholder: 'z. B. schwarze Katze, Glueckskeks, Bauchgefuehl',
		claimPlaceholder: 'z. B. heute kommt eine gute Nachricht',
		feltPlaceholder: 'Was es fuer mich bedeutet ...',
		expectedPlaceholder: 'z. B. Job-Zusage bis Freitag',
		tagsPlaceholder: 'arbeit, naturzeichen ...',
		submitCreate: '+ erfassen',
		submitUpdate: 'speichern',
		cancel: 'abbrechen',
	} as const;

	/* svelte-ignore state_referenced_locally */
	let kind = $state<AugurKind>(initial?.kind ?? 'hunch');
	/* svelte-ignore state_referenced_locally */
	let source = $state(initial?.source ?? '');
	/* svelte-ignore state_referenced_locally */
	let sourceCategory = $state<AugurSourceCategory>(initial?.sourceCategory ?? 'gut');
	/* svelte-ignore state_referenced_locally */
	let claim = $state(initial?.claim ?? '');
	/* svelte-ignore state_referenced_locally */
	let vibe = $state<AugurVibe>(initial?.vibe ?? 'mysterious');
	/* svelte-ignore state_referenced_locally */
	let feltMeaning = $state(initial?.feltMeaning ?? '');
	/* svelte-ignore state_referenced_locally */
	let expectedOutcome = $state(initial?.expectedOutcome ?? '');
	/* svelte-ignore state_referenced_locally */
	let expectedBy = $state(initial?.expectedBy ?? '');
	/* svelte-ignore state_referenced_locally */
	let probabilityPct = $state<number | null>(
		initial?.probability != null ? Math.round(initial.probability * 100) : null
	);
	/* svelte-ignore state_referenced_locally */
	let tagsText = $state(initial?.tags?.join(', ') ?? '');
	/* svelte-ignore state_referenced_locally */
	let encounteredAt = $state(initial?.encounteredAt ?? new Date().toISOString().slice(0, 10));

	const KIND_ORDER: AugurKind[] = ['omen', 'fortune', 'hunch'];
	const VIBE_ORDER: AugurVibe[] = ['good', 'mysterious', 'bad'];
	const CATEGORY_ORDER: AugurSourceCategory[] = [
		'gut',
		'tarot',
		'horoscope',
		'fortune-cookie',
		'iching',
		'dream',
		'person',
		'media',
		'natural',
		'other',
	];

	let saving = $state(false);

	function parseTags(): string[] {
		return tagsText
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!source.trim() || !claim.trim()) return;
		saving = true;
		try {
			const probability =
				probabilityPct != null ? Math.max(0, Math.min(1, probabilityPct / 100)) : null;
			if (mode === 'edit' && initial) {
				await augurStore.updateEntry(initial.id, {
					source: source.trim(),
					sourceCategory,
					claim: claim.trim(),
					vibe,
					feltMeaning: feltMeaning.trim() || null,
					expectedOutcome: expectedOutcome.trim() || null,
					expectedBy: expectedBy || null,
					probability,
					tags: parseTags(),
				});
			} else {
				await augurStore.createEntry({
					kind,
					source: source.trim(),
					sourceCategory,
					claim: claim.trim(),
					vibe,
					feltMeaning: feltMeaning.trim() || null,
					expectedOutcome: expectedOutcome.trim() || null,
					expectedBy: expectedBy || null,
					probability,
					encounteredAt,
					tags: parseTags(),
					livingOracleSnapshot: oracleReflection,
				});
			}
			onclose?.();
		} finally {
			saving = false;
		}
	}
</script>

<form class="form" onsubmit={handleSubmit}>
	{#if mode === 'create'}
		<div class="row">
			<label class="field">
				<span>{T.kind}</span>
				<select bind:value={kind}>
					{#each KIND_ORDER as k (k)}
						<option value={k}>{KIND_LABELS[k].de}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>{T.encounteredAt}</span>
				<input type="date" bind:value={encounteredAt} />
			</label>
		</div>
	{/if}

	<div class="row">
		<label class="field grow">
			<span>{T.source}</span>
			<input bind:value={source} placeholder={T.sourcePlaceholder} required />
		</label>
		<label class="field">
			<span>{T.category}</span>
			<select bind:value={sourceCategory}>
				{#each CATEGORY_ORDER as c (c)}
					<option value={c}>{SOURCE_CATEGORY_LABELS[c].de}</option>
				{/each}
			</select>
		</label>
	</div>

	<label class="field">
		<span>{T.claim}</span>
		<textarea bind:value={claim} placeholder={T.claimPlaceholder} rows="2" required></textarea>
	</label>

	<div class="row">
		<label class="field grow">
			<span>{T.vibe}</span>
			<div class="vibe-row">
				{#each VIBE_ORDER as v (v)}
					<button
						type="button"
						class="vibe-pill"
						class:active={vibe === v}
						onclick={() => (vibe = v)}
					>
						{VIBE_LABELS[v].de}
					</button>
				{/each}
			</div>
		</label>
	</div>

	<label class="field">
		<span>{T.feltMeaning}</span>
		<textarea bind:value={feltMeaning} placeholder={T.feltPlaceholder} rows="2"></textarea>
	</label>

	{#if mode === 'create'}
		<LivingOracleHint
			input={{
				kind,
				sourceCategory,
				vibe,
				tags: parseTags(),
				source,
				claim,
			}}
			{history}
			onreflection={(text) => (oracleReflection = text)}
		/>
	{/if}

	<details class="more">
		<summary>+ Prognose & Tags</summary>
		<label class="field">
			<span>{T.expectedOutcome}</span>
			<input bind:value={expectedOutcome} placeholder={T.expectedPlaceholder} />
		</label>
		<div class="row">
			<label class="field">
				<span>{T.expectedBy}</span>
				<input type="date" bind:value={expectedBy} />
			</label>
			<label class="field">
				<span>{T.probability}</span>
				<input
					type="number"
					min="0"
					max="100"
					step="5"
					bind:value={probabilityPct}
					placeholder="50"
				/>
			</label>
		</div>
		<label class="field">
			<span>{T.tags}</span>
			<input bind:value={tagsText} placeholder={T.tagsPlaceholder} />
		</label>
	</details>

	<div class="actions">
		{#if onclose}
			<button type="button" class="btn ghost" onclick={() => onclose?.()} disabled={saving}>
				{T.cancel}
			</button>
		{/if}
		<button type="submit" class="btn primary" disabled={saving}>
			{mode === 'edit' ? T.submitUpdate : T.submitCreate}
		</button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		border-radius: 0.85rem;
	}
	.row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.78rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.65));
	}
	.field.grow {
		flex: 1;
		min-width: 12rem;
	}
	.field input,
	.field select,
	.field textarea {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 0.65rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: var(--color-surface-input, rgba(255, 255, 255, 0.04));
		color: var(--color-text, inherit);
	}
	.field textarea {
		resize: vertical;
		min-height: 2.5rem;
	}
	.vibe-row {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.vibe-pill {
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		font: inherit;
		font-size: 0.85rem;
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		background: transparent;
		cursor: pointer;
		color: inherit;
	}
	.vibe-pill.active {
		background: color-mix(in srgb, #7c3aed 18%, transparent);
		border-color: #7c3aed;
		color: #c4b5fd;
		font-weight: 500;
	}
	.more {
		font-size: 0.85rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.65));
	}
	.more summary {
		cursor: pointer;
		padding: 0.35rem 0;
		user-select: none;
	}
	.more > * + * {
		margin-top: 0.5rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}
	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.btn.primary {
		background: color-mix(in srgb, #7c3aed 24%, transparent);
		border-color: #7c3aed;
		color: #ddd6fe;
	}
	.btn.primary:hover:not(:disabled) {
		background: color-mix(in srgb, #7c3aed 32%, transparent);
	}
	.btn.ghost {
		background: transparent;
		border-color: var(--color-border, rgba(255, 255, 255, 0.12));
		color: var(--color-text-muted, rgba(255, 255, 255, 0.65));
	}
	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
