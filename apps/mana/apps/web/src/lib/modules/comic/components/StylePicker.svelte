<!--
  StylePicker — radio-tiles for the five ComicStyle presets. Chosen at
  story-create time, fixed afterward (restyling = new story). Each
  tile carries a short "what this looks like" hint so the user can
  pick without having to memorise the preset mapping in styles.ts.
-->
<script lang="ts">
	import { STYLE_ORDER, STYLE_LABELS } from '../constants';
	import type { ComicStyle } from '../types';

	interface Props {
		value: ComicStyle;
		onChange: (next: ComicStyle) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();

	// Short descriptive hint per preset, shown under the label. Keep
	// each line ≤ 60 chars so 2-column layouts don't wrap.
	const HINTS: Record<ComicStyle, string> = {
		comic: 'Kräftige Linien, Cell-Shading, US-Comic-Look',
		manga: 'Schwarz/weiß, Screen-Tones, dynamische Perspektive',
		cartoon: 'Weich, pastellig, Saturday-Morning-Feeling',
		'graphic-novel': 'Aquarell / painterly, stimmungsvoll',
		webtoon: 'Vertikale Panels, moderne Farben, Soft-Shading',
	};
</script>

<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
	{#each STYLE_ORDER as style (style)}
		<button
			type="button"
			{disabled}
			onclick={() => onChange(style)}
			class="rounded-lg border px-3 py-2.5 text-left transition-colors
				{value === style
				? 'border-primary bg-primary/10 text-foreground'
				: 'border-border bg-background text-foreground hover:bg-muted'}"
			aria-pressed={value === style}
		>
			<div class="text-sm font-medium">{STYLE_LABELS[style].de}</div>
			<div class="mt-0.5 text-xs text-muted-foreground">{HINTS[style]}</div>
		</button>
	{/each}
</div>
