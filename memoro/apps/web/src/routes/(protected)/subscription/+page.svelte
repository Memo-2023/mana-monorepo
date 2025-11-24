<script lang="ts">
	import {
		BillingToggle,
		SubscriptionCard,
		PackageCard,
		UsageCard,
		CostCard,
		type BillingCycle,
		type SubscriptionPlan,
		type ManaPackage,
		type UsageData,
		type CostItem
	} from '@manacore/shared-subscription-ui';

	import subscriptionData from '$lib/data/subscriptionData.json';
	import appCostsData from '$lib/data/appCosts.json';
	import usageData from '$lib/data/usageData.json';

	// State
	let billingCycle = $state<BillingCycle>('monthly');

	// Data from JSON files
	const subscriptionOptions = subscriptionData.subscriptions as SubscriptionPlan[];
	const manaPackages = subscriptionData.packages as ManaPackage[];
	const appCosts = appCostsData.costs as CostItem[];
	const usage = usageData.usage as UsageData;

	// Get all subscription plans for current billing cycle
	function getAllSubscriptionPlans() {
		return subscriptionOptions.filter(
			(plan) => plan.id !== 'free' && plan.billingCycle === billingCycle
		);
	}

	// Get all mana packages
	function getAllManaPackages() {
		return manaPackages;
	}

	// Handlers
	function handleSubscribe(planId: string) {
		alert(`Subscribe to plan: ${planId}\n\nThis would trigger RevenueCat purchase flow.`);
	}

	function handleBuyPackage(packageId: string) {
		alert(`Buy package: ${packageId}\n\nThis would trigger RevenueCat purchase flow.`);
	}
</script>

<svelte:head>
	<title>Mana - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl pb-12">
	<h1 class="mb-8 text-3xl font-bold text-theme">Mana kaufen</h1>

	<!-- Active Section (Usage & Costs) -->
	<section class="mb-8">
		<div class="mb-4">
			<UsageCard usageData={usage} currentPlan="Free" />
		</div>

		<div class="mb-4">
			<CostCard costs={appCosts} />
		</div>
	</section>

	<!-- Billing Toggle -->
	<BillingToggle {billingCycle} onChange={(cycle) => (billingCycle = cycle)} yearlyDiscount="33%" />

	<!-- Subscriptions Section -->
	<section class="mb-12 pt-2">
		<h2 class="mb-6 text-2xl font-bold text-theme">Abonnements</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			<!-- Free Tier -->
			<SubscriptionCard
				plan={subscriptionOptions.find((plan) => plan.id === 'free')!}
				onSelect={handleSubscribe}
				isCurrentPlan={true}
			/>

			<!-- All Paid Subscriptions -->
			{#each getAllSubscriptionPlans() as plan}
				<SubscriptionCard {plan} onSelect={handleSubscribe} />
			{/each}
		</div>
	</section>

	<!-- One-time Purchases Section -->
	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-bold text-theme">Einmalkäufe</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<!-- All Mana Packages -->
			{#each getAllManaPackages() as pkg}
				<PackageCard package={pkg} onSelect={handleBuyPackage} />
			{/each}
		</div>
	</section>
		</div>
	</div>
</div>
