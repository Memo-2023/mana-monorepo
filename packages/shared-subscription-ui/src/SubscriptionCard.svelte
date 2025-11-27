<script lang="ts">
	import type { SubscriptionPlan } from '@manacore/shared-subscription-types';
	import SubscriptionButton from './SubscriptionButton.svelte';
	import ManaIcon from './ManaIcon.svelte';

	interface Props {
		plan: SubscriptionPlan;
		onSelect: (planId: string) => void;
		isCurrentPlan?: boolean;
		isLegacy?: boolean;
		// i18n labels
		currentPlanLabel?: string;
		legacyPlanLabel?: string;
		popularLabel?: string;
		perMonthLabel?: string;
		perYearLabel?: string;
		monthlyEquivalentLabel?: string;
		buyLabel?: string;
		yourPlanLabel?: string;
		yourLegacyPlanLabel?: string;
	}

	let {
		plan,
		onSelect,
		isCurrentPlan = false,
		isLegacy = false,
		currentPlanLabel = 'Current Plan',
		legacyPlanLabel = 'Legacy Plan',
		popularLabel = 'Popular',
		perMonthLabel = 'pro Monat',
		perYearLabel = 'pro Jahr',
		monthlyEquivalentLabel = '/Monat',
		buyLabel = 'Kaufen',
		yourPlanLabel = 'Dein Plan',
		yourLegacyPlanLabel = 'Dein Legacy-Plan',
	}: Props = $props();

	function formatPrice(plan: SubscriptionPlan) {
		return plan.priceString || `${plan.price.toFixed(2).replace('.', ',')}€`;
	}

	// Tier-specific background colors and sizes for Mana icon
	function getTierStyles() {
		const id = plan.id.toLowerCase();
		if (id.includes('free')) return { bg: '#F5F5F5', icon: '#9E9E9E', bgSize: '30%' };
		if (id.includes('small')) return { bg: '#E3F2FD', icon: '#2196F3', bgSize: '45%' };
		if (id.includes('medium')) return { bg: '#BBDEFB', icon: '#1976D2', bgSize: '60%' };
		if (id.includes('large')) return { bg: '#90CAF9', icon: '#1565C0', bgSize: '75%' };
		if (id.includes('giant')) return { bg: '#64B5F6', icon: '#0D47A1', bgSize: '90%' };
		return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
	}

	const tierStyles = $derived(getTierStyles());

	// Hover state
	let isHovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative rounded-xl p-4 transition-all duration-200 bg-content border hover:-translate-y-0.5 hover:shadow-lg"
	class:border-2={isCurrentPlan}
	class:border-mana={isCurrentPlan || plan.popular}
	class:border-theme={!isCurrentPlan && !plan.popular}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if isCurrentPlan}
		<div class="absolute -top-3 left-4 rounded-xl bg-mana px-3 py-1 text-xs font-bold text-white">
			{isLegacy ? legacyPlanLabel : currentPlanLabel}
		</div>
	{/if}
	{#if plan.popular && !isCurrentPlan}
		<div class="absolute -top-3 right-4 rounded-xl bg-mana px-3 py-1 text-xs font-bold text-white">
			{popularLabel}
		</div>
	{/if}

	<!-- Tier Name -->
	<h3 class="mb-4 text-center text-lg font-bold text-theme">
		{plan.name}
	</h3>

	<!-- Three column layout -->
	<div class="mb-5 flex justify-between gap-2">
		<!-- Mana Icon with background -->
		<div
			class="flex aspect-square flex-1 items-center justify-center rounded-xl bg-menu"
			style="min-height: 80px;"
		>
			<div
				class="flex items-center justify-center rounded-lg"
				style="width: {tierStyles.bgSize}; height: {tierStyles.bgSize}; background-color: {tierStyles.bg};"
			>
				<ManaIcon size={32} color={tierStyles.icon} />
			</div>
		</div>

		<!-- Mana Amount -->
		<div
			class="flex aspect-square flex-1 flex-col items-center justify-center rounded-xl bg-menu"
			style="min-height: 80px;"
		>
			<p class="mb-0.5 text-2xl font-bold text-theme">
				{plan.monthlyMana}
			</p>
			<p class="text-center text-xs text-theme-secondary">{perMonthLabel}</p>
		</div>

		<!-- Price -->
		<div
			class="flex aspect-square flex-1 flex-col items-center justify-center rounded-xl bg-menu"
			style="min-height: 80px;"
		>
			<p class="text-xl font-bold text-theme">
				{formatPrice(plan)}
			</p>
			<p class="mt-0.5 text-xs text-theme-secondary">
				{plan.billingCycle === 'yearly' ? perYearLabel : perMonthLabel}
			</p>
			{#if plan.billingCycle === 'yearly' && plan.monthlyEquivalent}
				<p class="mt-0 text-[9px] text-theme-secondary">
					({plan.monthlyEquivalent.toFixed(2).replace('.', ',')}€{monthlyEquivalentLabel})
				</p>
			{/if}
		</div>
	</div>

	<!-- Button only show if NOT free plan -->
	{#if !plan.id.toLowerCase().includes('free')}
		<SubscriptionButton
			label={isCurrentPlan ? (isLegacy ? yourLegacyPlanLabel : yourPlanLabel) : buyLabel}
			onclick={() => onSelect(plan.id)}
			iconName={isCurrentPlan ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
			variant={isCurrentPlan ? 'secondary' : plan.popular ? 'accent' : 'primary'}
			disabled={isCurrentPlan}
		/>
	{/if}
</div>
