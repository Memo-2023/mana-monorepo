<!--
  MissionInputPicker — lets the user link records (notes, goals, kontext,
  future modules…) as inputs for an AI Mission.

  Binds to a `MissionInputRef[]` so the caller can drop it into any form:

    <MissionInputPicker bind:value={formInputs} />

  The list of modules that appear in the picker is driven by whoever
  registered an indexer via `registerInputIndexer(name, fn)` — today that's
  the default resolvers (notes / kontext / goals), but each module can
  register a richer projection later without this component changing.
-->
<script lang="ts">
	import { Plus, X } from '@mana/shared-icons';
	import {
		listIndexedModules,
		getInputCandidates,
		type InputCandidate,
	} from '$lib/data/ai/missions/input-index';
	import { registerDefaultInputResolvers } from '$lib/data/ai/missions/default-resolvers';
	import type { MissionInputRef } from '$lib/data/ai/missions/types';

	interface Props {
		value: MissionInputRef[];
	}

	let { value = $bindable([]) }: Props = $props();

	// Ensure defaults are registered even if the layout tick hasn't started
	// yet (e.g. the create form opens before the first tick).
	registerDefaultInputResolvers();

	const modules = $derived(listIndexedModules());
	let activeModule = $state<string | null>(null);
	let candidates = $state<InputCandidate[]>([]);
	let loading = $state(false);

	$effect(() => {
		if (!activeModule) {
			candidates = [];
			return;
		}
		loading = true;
		void getInputCandidates(activeModule)
			.then((list) => {
				candidates = list;
			})
			.finally(() => {
				loading = false;
			});
	});

	function keyOf(ref: MissionInputRef): string {
		return `${ref.module}::${ref.table}::${ref.id}`;
	}

	const selectedKeys = $derived(new Set(value.map(keyOf)));

	function toggle(candidate: InputCandidate) {
		const key = keyOf(candidate);
		if (selectedKeys.has(key)) {
			value = value.filter((v) => keyOf(v) !== key);
		} else {
			value = [...value, { module: candidate.module, table: candidate.table, id: candidate.id }];
		}
	}

	function removeInput(ref: MissionInputRef) {
		const key = keyOf(ref);
		value = value.filter((v) => keyOf(v) !== key);
	}

	function labelFor(ref: MissionInputRef): string {
		const match = candidates.find(
			(c) => c.module === ref.module && c.table === ref.table && c.id === ref.id
		);
		return match?.label ?? `${ref.module}/${ref.id}`;
	}
</script>

<div class="picker">
	<div class="selected" aria-label="Verlinkte Inputs">
		{#if value.length === 0}
			<span class="hint">Keine Inputs verlinkt.</span>
		{:else}
			{#each value as ref (keyOf(ref))}
				<span class="chip">
					<span class="chip-mod">{ref.module}</span>
					<span class="chip-label">{labelFor(ref)}</span>
					<button type="button" onclick={() => removeInput(ref)} aria-label="Entfernen">
						<X size={12} weight="bold" />
					</button>
				</span>
			{/each}
		{/if}
	</div>

	<div class="picker-controls">
		<label>
			<span class="small">Modul</span>
			<select bind:value={activeModule}>
				<option value={null}>— wählen —</option>
				{#each modules as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</label>

		{#if activeModule}
			<div class="candidates">
				{#if loading}
					<p class="hint">lade…</p>
				{:else if candidates.length === 0}
					<p class="hint">Nichts in "{activeModule}" vorhanden.</p>
				{:else}
					{#each candidates as c (keyOf(c))}
						<button
							type="button"
							class="candidate"
							class:selected={selectedKeys.has(keyOf(c))}
							onclick={() => toggle(c)}
						>
							<Plus size={12} weight="bold" />
							<span class="cand-label">{c.label}</span>
							{#if c.hint}
								<span class="cand-hint">{c.hint}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.selected {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		min-height: 1.75rem;
		align-items: center;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.25rem 0.125rem 0.5rem;
		border: 1px solid color-mix(in oklab, var(--color-primary, #6b5bff) 45%, transparent);
		border-radius: 999px;
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 10%, var(--color-bg, #fff));
		font-size: 0.75rem;
	}
	.chip-mod {
		color: var(--color-muted, #888);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.625rem;
	}
	.chip button {
		border: none;
		background: transparent;
		padding: 0.125rem;
		cursor: pointer;
		color: var(--color-muted, #888);
		display: inline-flex;
	}
	.chip button:hover {
		color: var(--color-fg, inherit);
	}

	.picker-controls {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.picker-controls label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.small {
		font-size: 0.75rem;
		color: var(--color-muted, #888);
	}
	.picker-controls select {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.25rem;
		font: inherit;
	}

	.candidates {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 12rem;
		overflow-y: auto;
		padding: 0.25rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
	}
	.candidate {
		display: grid;
		grid-template-columns: 1rem 1fr auto;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		background: transparent;
		cursor: pointer;
		text-align: left;
		font-size: 0.8125rem;
	}
	.candidate:hover {
		border-color: var(--color-border, #ddd);
	}
	.candidate.selected {
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 10%, transparent);
		border-color: color-mix(in oklab, var(--color-primary, #6b5bff) 45%, transparent);
	}
	.cand-hint {
		color: var(--color-muted, #888);
		font-size: 0.75rem;
	}

	.hint {
		color: var(--color-muted, #888);
		font-size: 0.8125rem;
		padding: 0.25rem 0;
	}
</style>
