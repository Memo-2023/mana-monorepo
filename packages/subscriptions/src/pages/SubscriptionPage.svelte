<script lang="ts">
	import type { SubscriptionPlan, ManaPackage, BillingCycle } from '../plans';
	import type { UsageData, CostItem } from '../usage';
	import BillingToggle from '../BillingToggle.svelte';
	import SubscriptionCard from '../SubscriptionCard.svelte';
	import PackageCard from '../PackageCard.svelte';
	import UsageCard from '../UsageCard.svelte';
	import CostCard from '../CostCard.svelte';

	import defaultSubscriptionData from '../data/subscriptionData.json';
	import defaultAppCosts from '../data/appCosts.json';
	import defaultUsageData from '../data/defaultUsageData.json';

	interface Props {
		appName: string;
		onSubscribe: (planId: string) => void;
		onBuyPackage: (packageId: string) => void;
		currentPlanId?: string;
		usageData?: UsageData;
		subscriptions?: SubscriptionPlan[];
		packages?: ManaPackage[];
		costs?: CostItem[];
		pageTitle?: string;
		subscriptionsTitle?: string;
		packagesTitle?: string;
		yearlyDiscount?: string;
	}

	let {
		appName,
		onSubscribe,
		onBuyPackage,
		currentPlanId = 'free',
		usageData = defaultUsageData.usage as UsageData,
		subscriptions = defaultSubscriptionData.subscriptions as SubscriptionPlan[],
		packages = defaultSubscriptionData.packages as ManaPackage[],
		costs = defaultAppCosts.costs as CostItem[],
		pageTitle = 'Mana kaufen',
		subscriptionsTitle = 'Abonnements',
		packagesTitle = 'Einmalkäufe',
		yearlyDiscount = '33%',
	}: Props = $props();

	let billingCycle = $state<BillingCycle>('monthly');

	const currentPlanName = $derived(() => {
		const plan = subscriptions.find((p) => p.id === currentPlanId);
		return plan?.name || 'Free';
	});

	function getSubscriptionPlans() {
		return subscriptions.filter((plan) => plan.id !== 'free' && plan.billingCycle === billingCycle);
	}

	function isCurrentPlan(planId: string) {
		if (currentPlanId === 'free' && planId === 'free') return true;
		return planId === currentPlanId;
	}
</script>

<div class="sub-page">
	<!-- Billing toggle -->
	<div class="toggle-row">
		<BillingToggle {billingCycle} onChange={(cycle) => (billingCycle = cycle)} {yearlyDiscount} />
	</div>

	<!-- Subscriptions -->
	<section class="section">
		<h2 class="section-title">{subscriptionsTitle}</h2>
		<div class="card-list">
			<SubscriptionCard
				plan={subscriptions.find((plan) => plan.id === 'free')}
				onSelect={onSubscribe}
				isCurrentPlan={isCurrentPlan('free')}
			/>
			{#each getSubscriptionPlans() as plan}
				<SubscriptionCard {plan} onSelect={onSubscribe} isCurrentPlan={isCurrentPlan(plan.id)} />
			{/each}
		</div>
	</section>

	<!-- One-time packages -->
	<section class="section">
		<h2 class="section-title">{packagesTitle}</h2>
		<div class="card-list">
			{#each packages as pkg}
				<PackageCard package={pkg} onSelect={onBuyPackage} />
			{/each}
		</div>
	</section>

	<!-- Usage & Costs (collapsed, less prominent) -->
	<section class="section">
		<details class="details">
			<summary class="summary">Verbrauch & Kosten</summary>
			<div class="details-content">
				<UsageCard {usageData} currentPlan={currentPlanName()} />
				<CostCard {costs} />
			</div>
		</details>
	</section>
</div>

<style>
	.sub-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 40rem;
		margin: 0 auto;
		width: 100%;
	}

	.toggle-row {
		display: flex;
		justify-content: center;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.card-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.details {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.summary {
		padding: 0.75rem 1rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		user-select: none;
	}

	.summary:hover {
		color: hsl(var(--color-foreground));
	}

	.details-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0 1rem 1rem;
	}
</style>
