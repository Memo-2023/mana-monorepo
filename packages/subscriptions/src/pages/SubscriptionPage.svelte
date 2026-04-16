<script lang="ts">
	import type { SubscriptionPlan, ManaPackage, BillingCycle } from '../plans';
	import type { UsageData, CostItem } from '../usage';
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
		yearlyDiscount = '33%',
	}: Props = $props();

	// State
	let billingCycle = $state<BillingCycle>('monthly');

	// Get current plan name for display
	const currentPlanName = $derived(() => {
		const plan = subscriptions.find((p) => p.id === currentPlanId);
		return plan?.name || 'Free';
	});

	// Get all subscription plans for current billing cycle
	function getSubscriptionPlans() {
		return subscriptions.filter((plan) => plan.id !== 'free' && plan.billingCycle === billingCycle);
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

<div class="subscription-page">
	<!-- Content Area -->
	<div class="subscription-page__content">
		<div class="subscription-page__container">
			<!-- Header -->
			<div class="subscription-page__header">
				<div class="subscription-page__icon">
					<svg viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10">
						<path
							d="M12.3 1c.03.05 7.3 9.67 7.3 13.7 0 4.03-3.27 7.3-7.3 7.3S5 18.73 5 14.7C5 10.66 12.3 1 12.3 1zm0 6.4c-.02.03-3.65 4.83-3.65 6.84 0 2.02 1.64 3.65 3.65 3.65s3.65-1.64 3.65-3.65c0-2.01-3.62-6.81-3.65-6.84z"
						/>
					</svg>
				</div>
				<h1 class="subscription-page__title">{pageTitle}</h1>
				<p class="subscription-page__subtitle">Wähle das passende Paket für deine Bedürfnisse</p>
			</div>

			<!-- Active Section (Usage & Costs) -->
			<section class="subscription-page__section">
				<div class="subscription-page__usage-grid">
					<UsageCard {usageData} currentPlan={currentPlanName()} />
					<CostCard {costs} />
				</div>
			</section>

			<!-- Billing Toggle -->
			<div class="subscription-page__toggle">
				<BillingToggle
					{billingCycle}
					onChange={(cycle: BillingCycle) => (billingCycle = cycle)}
					{yearlyDiscount}
				/>
			</div>

			<!-- Subscriptions Section -->
			<section class="subscription-page__section">
				<h2 class="subscription-page__section-title">{subscriptionsTitle}</h2>

				<div class="subscription-page__cards-grid">
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
			<section class="subscription-page__section">
				<h2 class="subscription-page__section-title">{packagesTitle}</h2>

				<div class="subscription-page__cards-grid">
					{#each packages as pkg}
						<PackageCard package={pkg} onSelect={onBuyPackage} />
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.subscription-page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		width: 100%;
	}

	.subscription-page__content {
		flex: 1;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	.subscription-page__container {
		max-width: 40rem;
		margin: 0 auto;
		padding-bottom: 3rem;
		width: 100%;
		box-sizing: border-box;
	}

	.subscription-page__header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.subscription-page__icon {
		width: 5rem;
		height: 5rem;
		margin: 0 auto 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: hsl(var(--color-primary, 221 83% 53%));
	}

	:global(.dark) .subscription-page__icon {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.subscription-page__title {
		font-size: 1.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.75rem 0;
	}

	.subscription-page__subtitle {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.subscription-page__section {
		margin-bottom: 2.5rem;
	}

	.subscription-page__section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1.5rem 0;
	}

	.subscription-page__usage-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.subscription-page__toggle {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.subscription-page__cards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}
</style>
