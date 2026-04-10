<script lang="ts">
	import type { SubscriptionPlan } from './plans';
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

<div
	class="subscription-card"
	class:subscription-card--current={isCurrentPlan}
	class:subscription-card--popular={plan.popular && !isCurrentPlan}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	role="article"
>
	{#if isCurrentPlan}
		<div class="subscription-card__badge subscription-card__badge--current">
			{isLegacy ? legacyPlanLabel : currentPlanLabel}
		</div>
	{/if}
	{#if plan.popular && !isCurrentPlan}
		<div class="subscription-card__badge subscription-card__badge--popular">
			{popularLabel}
		</div>
	{/if}

	<!-- Tier Name -->
	<h3 class="subscription-card__title">
		{plan.name}
	</h3>

	<!-- Three column layout -->
	<div class="subscription-card__grid">
		<!-- Mana Icon with background -->
		<div class="subscription-card__cell">
			<div
				class="subscription-card__icon-wrapper"
				style="width: {tierStyles.bgSize}; height: {tierStyles.bgSize}; background-color: {tierStyles.bg};"
			>
				<ManaIcon size={32} color={tierStyles.icon} />
			</div>
		</div>

		<!-- Mana Amount -->
		<div class="subscription-card__cell">
			<p class="subscription-card__value">
				{plan.monthlyMana}
			</p>
			<p class="subscription-card__label">{perMonthLabel}</p>
		</div>

		<!-- Price -->
		<div class="subscription-card__cell">
			<p class="subscription-card__price">
				{formatPrice(plan)}
			</p>
			<p class="subscription-card__label">
				{plan.billingCycle === 'yearly' ? perYearLabel : perMonthLabel}
			</p>
			{#if plan.billingCycle === 'yearly' && plan.monthlyEquivalent}
				<p class="subscription-card__sublabel">
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

<style>
	.subscription-card {
		position: relative;
		padding: 1.25rem;
		border-radius: 1rem;
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

	:global(.dark) .subscription-card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.subscription-card:hover {
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .subscription-card:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.subscription-card--current {
		border: 2px solid hsl(var(--primary, 221 83% 53%));
	}

	.subscription-card--popular {
		border: 2px solid hsl(var(--primary, 221 83% 53%));
	}

	.subscription-card__badge {
		position: absolute;
		top: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		color: white;
		background: hsl(var(--primary, 221 83% 53%));
		z-index: 1;
	}

	.subscription-card__badge--current {
		left: 0.75rem;
	}

	.subscription-card__badge--popular {
		right: 0.75rem;
	}

	.subscription-card__title {
		margin: 1.5rem 0 1rem 0;
		text-align: center;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.subscription-card__grid {
		display: flex;
		justify-content: space-between;
		gap: 0.375rem;
		margin-bottom: 1.25rem;
	}

	.subscription-card__cell {
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

	:global(.dark) .subscription-card__cell {
		background: rgba(255, 255, 255, 0.05);
	}

	.subscription-card__icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
	}

	.subscription-card__value {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.subscription-card__price {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.subscription-card__label {
		margin: 0;
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
		text-align: center;
	}

	.subscription-card__sublabel {
		margin: 0.125rem 0 0 0;
		font-size: 0.5rem;
		color: hsl(var(--muted-foreground));
	}

	@media (min-width: 640px) {
		.subscription-card__value {
			font-size: 1.5rem;
		}

		.subscription-card__price {
			font-size: 1.25rem;
		}

		.subscription-card__label {
			font-size: 0.75rem;
		}

		.subscription-card__sublabel {
			font-size: 0.625rem;
		}
	}
</style>
