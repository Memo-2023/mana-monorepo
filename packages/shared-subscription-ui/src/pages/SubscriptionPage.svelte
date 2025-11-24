<script lang="ts">
	import type { SubscriptionPlan, ManaPackage, UsageData, CostItem, BillingCycle } from '@manacore/shared-subscription-types';
	import BillingToggle from '../BillingToggle.svelte';
	import SubscriptionCard from '../SubscriptionCard.svelte';
	import PackageCard from '../PackageCard.svelte';
	import UsageCard from '../UsageCard.svelte';
	import CostCard from '../CostCard.svelte';

	// Import default data
	import defaultSubscriptionData from '../data/subscriptionData.json';
	import defaultAppCosts from '../data/appCosts.json';
	import defaultUsageData from '../data/defaultUsageData.json';

	interface Props {
		/** App name for the page title */
		appName: string;
		/** Handler when user selects a subscription plan */
		onSubscribe: (planId: string) => void;
		/** Handler when user selects a mana package */
		onBuyPackage: (packageId: string) => void;
		/** Current plan ID (e.g., 'free', 'Mana_Stream_Small_v1') */
		currentPlanId?: string;
		/** Current user's usage data (optional, uses defaults if not provided) */
		usageData?: UsageData;
		/** Custom subscription plans (optional, uses defaults if not provided) */
		subscriptions?: SubscriptionPlan[];
		/** Custom mana packages (optional, uses defaults if not provided) */
		packages?: ManaPackage[];
		/** Custom cost items (optional, uses defaults if not provided) */
		costs?: CostItem[];
		/** Page title */
		pageTitle?: string;
		/** Subscriptions section title */
		subscriptionsTitle?: string;
		/** One-time purchases section title */
		packagesTitle?: string;
		/** Yearly discount label */
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
		yearlyDiscount = '33%'
	}: Props = $props();

	// State
	let billingCycle = $state<BillingCycle>('monthly');

	// Get current plan name for display
	const currentPlanName = $derived(() => {
		const plan = subscriptions.find(p => p.id === currentPlanId);
		return plan?.name || 'Free';
	});

	// Get all subscription plans for current billing cycle
	function getSubscriptionPlans() {
		return subscriptions.filter(
			(plan) => plan.id !== 'free' && plan.billingCycle === billingCycle
		);
	}

	// Check if a plan is the current plan
	function isCurrentPlan(planId: string) {
		if (currentPlanId === 'free' && planId === 'free') return true;
		return planId === currentPlanId;
	}
</script>

<svelte:head>
	<title>Mana - {appName}</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl pb-12">
			<h1 class="mb-8 text-3xl font-bold text-theme">{pageTitle}</h1>

			<!-- Active Section (Usage & Costs) -->
			<section class="mb-8">
				<div class="mb-4">
					<UsageCard {usageData} currentPlan={currentPlanName()} />
				</div>

				<div class="mb-4">
					<CostCard {costs} />
				</div>
			</section>

			<!-- Billing Toggle -->
			<BillingToggle {billingCycle} onChange={(cycle: BillingCycle) => (billingCycle = cycle)} {yearlyDiscount} />

			<!-- Subscriptions Section -->
			<section class="mb-12 pt-2">
				<h2 class="mb-6 text-2xl font-bold text-theme">{subscriptionsTitle}</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					<!-- Free Tier -->
					<SubscriptionCard
						plan={subscriptions.find((plan) => plan.id === 'free')!}
						onSelect={onSubscribe}
						isCurrentPlan={isCurrentPlan('free')}
					/>

					<!-- All Paid Subscriptions -->
					{#each getSubscriptionPlans() as plan}
						<SubscriptionCard
							{plan}
							onSelect={onSubscribe}
							isCurrentPlan={isCurrentPlan(plan.id)}
						/>
					{/each}
				</div>
			</section>

			<!-- One-time Purchases Section -->
			<section class="mb-12">
				<h2 class="mb-6 text-2xl font-bold text-theme">{packagesTitle}</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each packages as pkg}
						<PackageCard package={pkg} onSelect={onBuyPackage} />
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>
