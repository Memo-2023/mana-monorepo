<!--
  ProviderPicker — multi-select chips for one research category.
  Shows key-status (free/ready/needs-key) + pricing per call.
-->
<script lang="ts">
	import type { ProviderHealthEntry, ProviderInfo, ResearchCategory } from '../types';

	interface Props {
		category: ResearchCategory;
		providers: ProviderInfo[];
		health: ProviderHealthEntry[];
		selected: string[];
		onToggle: (id: string) => void;
	}

	const { category, providers, health, selected, onToggle }: Props = $props();

	function status(id: string): ProviderHealthEntry['status'] {
		return health.find((h) => h.id === id)?.status ?? 'needs-key';
	}

	function priceOf(p: ProviderInfo): number | undefined {
		if (category === 'search') return p.pricing?.search;
		if (category === 'extract') return p.pricing?.extract;
		return p.pricing?.research;
	}

	function isReady(id: string): boolean {
		const s = status(id);
		return s === 'ready' || s === 'free';
	}
</script>

<div class="picker">
	{#each providers as p (p.id)}
		{@const ready = isReady(p.id)}
		{@const price = priceOf(p)}
		{@const isSelected = selected.includes(p.id)}
		<button
			type="button"
			class="chip"
			class:selected={isSelected}
			class:disabled={!ready}
			disabled={!ready}
			onclick={() => onToggle(p.id)}
			title={ready ? `${p.id}` : `${p.id} — API-Key fehlt`}
		>
			<span class="chip-name">{p.id}</span>
			{#if price !== undefined}
				<span class="chip-price">{price === 0 ? 'free' : `${price}¢`}</span>
			{/if}
			<span class="chip-status status-{status(p.id)}">
				{#if status(p.id) === 'ready'}●{:else if status(p.id) === 'free'}◯{:else}✕{/if}
			</span>
		</button>
	{/each}
</div>

<style>
	.picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.chip:hover:not(.disabled) {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-border-strong));
	}

	.chip.selected {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary) / 0.6);
		color: hsl(var(--color-primary));
	}

	.chip.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.chip-name {
		font-family: ui-monospace, SFMono-Regular, monospace;
	}

	.chip-price {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
	}

	.chip-status {
		font-size: 0.625rem;
		line-height: 1;
	}

	.chip.selected .chip-price {
		color: hsl(var(--color-primary) / 0.7);
	}

	.status-ready {
		color: hsl(142 71% 45%);
	}
	.status-free {
		color: hsl(var(--color-muted-foreground));
	}
	.status-needs-key {
		color: hsl(var(--color-error, 0 84% 60%));
	}
</style>
