<!--
  StylePicker — dropdown for selecting a writing style in the briefing.

  The picker emits an opaque id in one of three shapes:
    - null            → ad-hoc / no style
    - `preset:<id>`   → reference to a built-in preset (no Dexie row)
    - <uuid>          → reference to a custom LocalWritingStyle row

  The generations store resolves both prefixes transparently, so picking
  a preset does NOT require writing to Dexie. Users favourite / customise
  via the /writing/styles view.
-->
<script lang="ts">
	import { STYLE_PRESETS } from '../presets/styles';
	import { useAllStyles } from '../queries';

	let {
		value,
		onchange,
	}: {
		value: string | null;
		onchange: (next: string | null) => void;
	} = $props();

	const customStyles$ = useAllStyles();
	const customStyles = $derived(customStyles$.value);

	function handle(ev: Event) {
		const target = ev.target as HTMLSelectElement;
		const raw = target.value;
		onchange(raw === '' ? null : raw);
	}
</script>

<select class="style-picker" value={value ?? ''} onchange={handle}>
	<option value="">— Kein Stil —</option>

	<optgroup label="Vorlagen">
		{#each STYLE_PRESETS as preset (preset.id)}
			<option value={`preset:${preset.id}`}>{preset.name.de}</option>
		{/each}
	</optgroup>

	{#if customStyles.length > 0}
		<optgroup label="Meine Stile">
			{#each customStyles as style (style.id)}
				<option value={style.id}>{style.name}</option>
			{/each}
		</optgroup>
	{/if}
</select>

<style>
	.style-picker {
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font: inherit;
		color: inherit;
		width: 100%;
	}
	.style-picker:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		border-color: transparent;
	}
</style>
