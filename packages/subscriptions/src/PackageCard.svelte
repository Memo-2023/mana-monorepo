<script lang="ts">
	import type { ManaPackage } from './plans';
	import ManaIcon from './ManaIcon.svelte';

	interface Props {
		package: ManaPackage;
		onSelect: (packageId: string) => void;
		popularLabel?: string;
		buyLabel?: string;
	}

	let { package: pkg, onSelect, popularLabel = 'Beliebt', buyLabel = 'Kaufen' }: Props = $props();

	function formatPrice(p: ManaPackage) {
		return p.priceString || `${p.price.toFixed(2).replace('.', ',')}€`;
	}

	function getColor() {
		const id = pkg.id.toLowerCase();
		if (id.includes('small')) return '#2196F3';
		if (id.includes('medium')) return '#1976D2';
		if (id.includes('large')) return '#1565C0';
		if (id.includes('giant')) return '#0D47A1';
		return '#0288D1';
	}
</script>

<button class="row" class:popular={pkg.popular} onclick={() => onSelect(pkg.id)}>
	<div class="icon">
		<ManaIcon size={20} color={getColor()} />
	</div>

	<div class="info">
		<span class="name">
			{pkg.name}
			{#if pkg.popular}
				<span class="badge">{popularLabel}</span>
			{/if}
		</span>
		<span class="mana">{pkg.manaAmount.toLocaleString('de-DE')} Mana</span>
	</div>

	<span class="price">{formatPrice(pkg)}</span>
	<span class="action">{buyLabel}</span>
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		color: hsl(var(--color-foreground));
		font: inherit;
	}

	.row:hover {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.row.popular {
		border-color: hsl(var(--color-primary));
	}

	.icon {
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.5);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.name {
		font-size: 0.875rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.mana {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.badge {
		font-size: 0.625rem;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-weight: 600;
		color: white;
		background: hsl(var(--color-primary));
	}

	.price {
		flex-shrink: 0;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.action {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		white-space: nowrap;
	}
</style>
