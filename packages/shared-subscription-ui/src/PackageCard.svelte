<script lang="ts">
	import type { ManaPackage } from '@manacore/shared-subscription-types';
	import SubscriptionButton from './SubscriptionButton.svelte';
	import ManaIcon from './ManaIcon.svelte';

	interface Props {
		package: ManaPackage;
		onSelect: (packageId: string) => void;
		// i18n labels
		popularLabel?: string;
		manaLabel?: string;
		oneTimeLabel?: string;
		buyLabel?: string;
	}

	let {
		package: pkg,
		onSelect,
		popularLabel = 'Popular',
		manaLabel = 'Mana',
		oneTimeLabel = 'Einmalig',
		buyLabel = 'Kaufen',
	}: Props = $props();

	function formatPrice(pkg: ManaPackage) {
		return pkg.priceString || `${pkg.price.toFixed(2).replace('.', ',')}€`;
	}

	// Package-specific colors and background sizes
	function getPackageStyles() {
		const id = pkg.id.toLowerCase();
		if (id.includes('small')) return { bg: '#E3F2FD', icon: '#2196F3', bgSize: '45%' };
		if (id.includes('medium')) return { bg: '#BBDEFB', icon: '#1976D2', bgSize: '60%' };
		if (id.includes('large')) return { bg: '#90CAF9', icon: '#1565C0', bgSize: '75%' };
		if (id.includes('giant')) return { bg: '#64B5F6', icon: '#0D47A1', bgSize: '90%' };
		return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
	}

	const packageStyles = $derived(getPackageStyles());

	// Hover state
	let isHovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="package-card"
	class:package-card--popular={pkg.popular}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if pkg.popular}
		<div class="package-card__badge">
			{popularLabel}
		</div>
	{/if}

	<!-- Package Name -->
	<h3 class="package-card__title">
		{pkg.name}
	</h3>

	<!-- Three column layout -->
	<div class="package-card__grid">
		<!-- Mana Icon with background -->
		<div class="package-card__cell">
			<div
				class="package-card__icon-wrapper"
				style="width: {packageStyles.bgSize}; height: {packageStyles.bgSize}; background-color: {packageStyles.bg};"
			>
				<ManaIcon size={32} color={packageStyles.icon} />
			</div>
		</div>

		<!-- Mana Amount -->
		<div class="package-card__cell">
			<p class="package-card__value">
				{pkg.manaAmount}
			</p>
			<p class="package-card__label">{manaLabel}</p>
		</div>

		<!-- Price -->
		<div class="package-card__cell">
			<p class="package-card__price">
				{formatPrice(pkg)}
			</p>
			<p class="package-card__sublabel">{oneTimeLabel}</p>
		</div>
	</div>

	<SubscriptionButton
		label={buyLabel}
		onclick={() => onSelect(pkg.id)}
		iconName="arrow-forward-outline"
		leftIconName="cart-outline"
		variant={pkg.popular ? 'accent' : 'primary'}
	/>
</div>

<style>
	.package-card {
		position: relative;
		padding: 1rem;
		border-radius: 0.75rem;
		transition: all 0.2s ease;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		min-width: 0;
		overflow: hidden;
	}

	:global(.dark) .package-card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.package-card:hover {
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .package-card:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.package-card--popular {
		border: 2px solid hsl(var(--primary, 221 83% 53%));
	}

	.package-card__badge {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		color: white;
		background: hsl(var(--primary, 221 83% 53%));
		z-index: 1;
	}

	.package-card__title {
		margin: 1.5rem 0 1rem 0;
		text-align: center;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.package-card__grid {
		display: flex;
		justify-content: space-between;
		gap: 0.375rem;
		margin-bottom: 1.25rem;
	}

	.package-card__cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		min-height: 70px;
		min-width: 0;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .package-card__cell {
		background: rgba(255, 255, 255, 0.05);
	}

	.package-card__icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
	}

	.package-card__value {
		margin: 0 0 0.125rem 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.package-card__price {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.package-card__label {
		margin: 0;
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
		text-align: center;
	}

	.package-card__sublabel {
		margin: 0.125rem 0 0 0;
		font-size: 0.5rem;
		color: hsl(var(--muted-foreground));
	}

	@media (min-width: 640px) {
		.package-card__value {
			font-size: 1.5rem;
		}

		.package-card__price {
			font-size: 1.25rem;
		}

		.package-card__label {
			font-size: 0.75rem;
		}

		.package-card__sublabel {
			font-size: 0.625rem;
		}
	}
</style>
