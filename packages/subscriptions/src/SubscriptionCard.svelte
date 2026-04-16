<script lang="ts">
	import type { SubscriptionPlan } from './plans';
	import ManaIcon from './ManaIcon.svelte';

	interface Props {
		plan: SubscriptionPlan;
		onSelect: (planId: string) => void;
		isCurrentPlan?: boolean;
		isLegacy?: boolean;
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
		currentPlanLabel = 'Aktuell',
		legacyPlanLabel = 'Legacy',
		popularLabel = 'Beliebt',
		perMonthLabel = '/Mo',
		perYearLabel = '/Jahr',
		buyLabel = 'Kaufen',
		yourPlanLabel = 'Dein Plan',
	}: Props = $props();

	function formatPrice(p: SubscriptionPlan) {
		return p.priceString || `${p.price.toFixed(2).replace('.', ',')}€`;
	}

	function getTierColor() {
		const id = plan.id.toLowerCase();
		if (id.includes('free')) return '#9E9E9E';
		if (id.includes('small')) return '#2196F3';
		if (id.includes('medium')) return '#1976D2';
		if (id.includes('large')) return '#1565C0';
		if (id.includes('giant')) return '#0D47A1';
		return '#0288D1';
	}

	const isFree = $derived(plan.id.toLowerCase().includes('free'));
</script>

<button
	class="row"
	class:current={isCurrentPlan}
	class:popular={plan.popular && !isCurrentPlan}
	disabled={isCurrentPlan}
	onclick={() => onSelect(plan.id)}
>
	<div class="icon" style="color: {getTierColor()}">
		<ManaIcon size={20} color={getTierColor()} />
	</div>

	<div class="info">
		<span class="name">
			{plan.name}
			{#if isCurrentPlan}
				<span class="badge current-badge">{isLegacy ? legacyPlanLabel : currentPlanLabel}</span>
			{/if}
			{#if plan.popular && !isCurrentPlan}
				<span class="badge popular-badge">{popularLabel}</span>
			{/if}
		</span>
		<span class="mana">{plan.monthlyMana} Mana{perMonthLabel}</span>
	</div>

	<div class="right">
		{#if isFree}
			<span class="price free">Kostenlos</span>
		{:else}
			<span class="price">{formatPrice(plan)}</span>
			<span class="period">{plan.billingCycle === 'yearly' ? perYearLabel : perMonthLabel}</span>
		{/if}
	</div>

	{#if !isFree && !isCurrentPlan}
		<span class="action">{buyLabel}</span>
	{:else if isCurrentPlan}
		<span class="action muted">{yourPlanLabel}</span>
	{/if}
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

	.row:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.row:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.row.current {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
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
	}

	.current-badge {
		background: hsl(var(--color-primary));
	}

	.popular-badge {
		background: hsl(var(--color-primary));
	}

	.right {
		flex-shrink: 0;
		text-align: right;
	}

	.price {
		display: block;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.price.free {
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}

	.period {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.action {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		white-space: nowrap;
	}

	.action.muted {
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}
</style>
