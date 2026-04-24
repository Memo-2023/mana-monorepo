<!--
  Compact segmented picker for the Try-On model. Three options keep
  the decision space small:
    - OpenAI GPT-image-2 (default, cheapest mid-tier, falls back to
      gpt-image-1 server-side when the user's org isn't verified).
    - Google Nano Banana Pro (gemini-3-pro-image-preview) — premium
      character consistency, more expensive.
    - Google Nano Banana 2 (gemini-3.1-flash-image-preview) — newest,
      fast, cheap.
  Binds to a parent-owned TryOnModel so callers can persist the
  choice (e.g. in wardrobe settings later). No opinion on layout —
  wraps to two rows on the narrow workbench card, stays single-row
  on the detail route.
-->
<script lang="ts">
	import type { TryOnModel } from '../api/try-on';

	interface Props {
		value: TryOnModel;
		onChange: (next: TryOnModel) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();

	const OPTIONS: Array<{
		id: TryOnModel;
		label: string;
		hint: string;
	}> = [
		{
			id: 'openai/gpt-image-2',
			label: 'OpenAI',
			hint: 'GPT-image · Standard',
		},
		{
			id: 'google/gemini-3-pro-image-preview',
			label: 'Nano Banana Pro',
			hint: 'Google · hohe Konsistenz',
		},
		{
			id: 'google/gemini-3.1-flash-image-preview',
			label: 'Nano Banana 2',
			hint: 'Google · neuestes · günstig',
		},
	];
</script>

<fieldset class="picker" {disabled}>
	<legend class="legend">Modell</legend>
	<div class="options">
		{#each OPTIONS as opt (opt.id)}
			<button
				type="button"
				class="option"
				class:active={value === opt.id}
				aria-pressed={value === opt.id}
				{disabled}
				onclick={() => onChange(opt.id)}
			>
				<span class="label">{opt.label}</span>
				<span class="hint">{opt.hint}</span>
			</button>
		{/each}
	</div>
</fieldset>

<style>
	.picker {
		border: none;
		padding: 0;
		margin: 0;
	}
	.legend {
		padding: 0;
		margin: 0 0 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
	}
	.options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.375rem;
	}
	.option {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background) / 0.5);
		border-radius: 0.5rem;
		cursor: pointer;
		font: inherit;
		text-align: left;
		transition:
			border-color 0.15s,
			background-color 0.15s,
			color 0.15s;
	}
	.option:hover:not([disabled]) {
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.04);
	}
	.option.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
	.option:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.hint {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
