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
		buyLabel = 'Kaufen'
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
	class="relative rounded-xl p-4 transition-all duration-200 bg-content border hover:-translate-y-0.5 hover:shadow-lg"
	class:border-mana={pkg.popular}
	class:border-theme={!pkg.popular}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if pkg.popular}
		<div class="absolute -top-3 right-4 rounded-xl bg-mana px-3 py-1 text-xs font-bold text-white">
			{popularLabel}
		</div>
	{/if}

	<!-- Package Name -->
	<h3 class="mb-4 text-center text-lg font-bold text-theme">
		{pkg.name}
	</h3>

	<!-- Three column layout -->
	<div class="mb-5 flex justify-between gap-2">
		<!-- Mana Icon with background -->
		<div class="flex aspect-square flex-1 items-center justify-center rounded-xl bg-menu" style="min-height: 80px;">
			<div
				class="flex items-center justify-center rounded-lg"
				style="width: {packageStyles.bgSize}; height: {packageStyles.bgSize}; background-color: {packageStyles.bg};"
			>
				<ManaIcon size={32} color={packageStyles.icon} />
			</div>
		</div>

		<!-- Mana Amount -->
		<div class="flex aspect-square flex-1 flex-col items-center justify-center rounded-xl bg-menu" style="min-height: 80px;">
			<p class="mb-0.5 text-2xl font-bold text-theme">
				{pkg.manaAmount}
			</p>
			<p class="text-center text-xs text-theme-secondary">{manaLabel}</p>
		</div>

		<!-- Price -->
		<div class="flex aspect-square flex-1 flex-col items-center justify-center rounded-xl bg-menu" style="min-height: 80px;">
			<p class="text-xl font-bold text-theme">
				{formatPrice(pkg)}
			</p>
			<p class="mt-0.5 text-[10px] text-theme-secondary">{oneTimeLabel}</p>
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
