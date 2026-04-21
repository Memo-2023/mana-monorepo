<!--
  HighlightMenu — floating popover anchored near a selection or an
  existing highlight span.

  Two modes:
    - mode="create"  → shown right after the user makes a selection.
      Color swatches + optional note, "Speichern" / "Abbrechen".
    - mode="edit"    → shown when the user clicks an existing highlight.
      Color change + note edit + delete.

  The component is positioned absolutely inside a positioned parent;
  HighlightLayer computes the `top`/`left` props from the selection
  rect and passes them in.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { HighlightColor } from '../types';

	const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

	interface CreateProps {
		mode: 'create';
		top: number;
		left: number;
		initialColor?: HighlightColor;
		onsave: (color: HighlightColor, note: string | null) => void;
		oncancel: () => void;
	}

	interface EditProps {
		mode: 'edit';
		top: number;
		left: number;
		initialColor: HighlightColor;
		initialNote: string | null;
		onupdate: (color: HighlightColor, note: string | null) => void;
		ondelete: () => void;
		onclose: () => void;
	}

	type Props = CreateProps | EditProps;
	const props: Props = $props();

	// The menu is destroyed + re-mounted whenever the parent switches
	// between create/edit branches, so reading props once at mount for
	// the initial local state is intentional. untrack() tells Svelte's
	// analyzer "I know this isn't reactive, that's the point."
	let color = $state<HighlightColor>(
		untrack(() => (props.mode === 'edit' ? props.initialColor : (props.initialColor ?? 'yellow')))
	);
	let note = $state<string>(
		untrack(() => (props.mode === 'edit' ? (props.initialNote ?? '') : ''))
	);
	let showNote = $state(untrack(() => props.mode === 'edit' && (props.initialNote ?? '') !== ''));

	function submit() {
		const finalNote = note.trim() || null;
		if (props.mode === 'create') {
			props.onsave(color, finalNote);
		} else {
			props.onupdate(color, finalNote);
		}
	}
</script>

<div class="menu" style:top="{props.top}px" style:left="{props.left}px" role="dialog">
	<div class="swatches" role="radiogroup" aria-label="Farbe">
		{#each COLORS as c (c)}
			<button
				type="button"
				class="swatch swatch-{c}"
				class:active={color === c}
				onclick={() => (color = c)}
				aria-label={c}
				aria-pressed={color === c}
			></button>
		{/each}
	</div>

	{#if showNote}
		<textarea
			class="note"
			bind:value={note}
			placeholder="Notiz (optional)…"
			rows="2"
			onkeydown={(e) => {
				if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
			}}
		></textarea>
	{:else}
		<button type="button" class="add-note" onclick={() => (showNote = true)}>+ Notiz</button>
	{/if}

	<div class="actions">
		{#if props.mode === 'create'}
			<button type="button" class="primary" onclick={submit}>Speichern</button>
			<button type="button" class="secondary" onclick={props.oncancel}>Abbrechen</button>
		{:else}
			<button type="button" class="primary" onclick={submit}>Übernehmen</button>
			<button type="button" class="danger" onclick={props.ondelete}>Löschen</button>
			<button type="button" class="secondary" onclick={props.onclose}>Schließen</button>
		{/if}
	</div>
</div>

<style>
	.menu {
		position: absolute;
		z-index: 50;
		background: #ffffff;
		color: #1e293b;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 0.55rem;
		padding: 0.55rem;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.08),
			0 2px 4px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 220px;
		max-width: 320px;
	}
	.swatches {
		display: flex;
		gap: 0.35rem;
	}
	.swatch {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
	}
	.swatch.active {
		border-color: rgba(0, 0, 0, 0.55);
	}
	.swatch-yellow {
		background: #fde68a;
	}
	.swatch-green {
		background: #bbf7d0;
	}
	.swatch-blue {
		background: #bfdbfe;
	}
	.swatch-pink {
		background: #fbcfe8;
	}
	.note {
		font: inherit;
		padding: 0.45rem 0.55rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: white;
		color: inherit;
		resize: vertical;
		min-height: 2.5rem;
	}
	.add-note {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.35rem 0.6rem;
		border: 1px dashed rgba(0, 0, 0, 0.2);
		background: transparent;
		color: inherit;
		border-radius: 0.4rem;
		cursor: pointer;
		align-self: flex-start;
	}
	.actions {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.actions button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid transparent;
		cursor: pointer;
	}
	.primary {
		background: #f97316;
		color: white;
		border-color: #f97316;
	}
	.primary:hover {
		background: #ea580c;
	}
	.secondary {
		background: transparent;
		color: inherit;
		border-color: rgba(0, 0, 0, 0.15);
	}
	.secondary:hover {
		border-color: rgba(0, 0, 0, 0.35);
	}
	.danger {
		background: transparent;
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}
	.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}
</style>
