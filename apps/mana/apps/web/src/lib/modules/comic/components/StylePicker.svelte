<!--
  StylePicker — radio-tiles for the five ComicStyle presets. Chosen at
  story-create time, fixed afterward (restyling = new story). Each
  tile carries a short "what this looks like" hint so the user can
  pick without having to memorise the preset mapping in styles.ts.

  Markup pattern matches `PanelModelPicker` / wardrobe's
  `TryOnModelPicker` so the create-flow has a coherent "click these
  cards" affordance — both border AND background shift on hover so
  the tiles read clearly as buttons.
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

<div class="picker" role="radiogroup" aria-label="Comic-Stil">
	{#each STYLE_ORDER as style (style)}
		<button
			type="button"
			class="option"
			class:active={value === style}
			role="radio"
			aria-checked={value === style}
			{disabled}
			onclick={() => onChange(style)}
		>
			<span class="label">{STYLE_LABELS[style].de}</span>
			<span class="hint">{HINTS[style]}</span>
		</button>
	{/each}
</div>

<style>
	.picker {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: 0.5rem;
	}
	.option {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background) / 0.5);
		border-radius: 0.5rem;
		cursor: pointer;
		font: inherit;
		text-align: left;
		transition:
			border-color 0.15s,
			background-color 0.15s,
			box-shadow 0.15s,
			transform 0.05s;
	}
	.option:hover:not([disabled]):not(.active) {
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-primary) / 0.05);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.04);
	}
	.option:active:not([disabled]) {
		transform: translateY(1px);
	}
	.option.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
		box-shadow: 0 1px 3px hsl(var(--color-primary) / 0.15);
	}
	.option:focus-visible {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 2px;
	}
	.option:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.label {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.hint {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.35;
	}
</style>
