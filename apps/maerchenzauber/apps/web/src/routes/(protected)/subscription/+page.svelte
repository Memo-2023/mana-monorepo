<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import type { CreditBalance } from '$lib/types/api';
	import type {
		SubscriptionPlan,
		ManaPackage,
		UsageData,
		CostItem,
		BillingCycle,
	} from '@manacore/shared-subscription-types';

	// Import shared components
	import {
		BillingToggle,
		SubscriptionCard,
		PackageCard,
		UsageCard,
		CostCard,
		defaultSubscriptionData,
	} from '@manacore/shared-subscription-ui';

	// State
	let creditBalance = $state<CreditBalance | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let billingCycle = $state<BillingCycle>('monthly');
	let processingPayment = $state(false);

	// Default subscription data
	const subscriptions = defaultSubscriptionData.subscriptions as SubscriptionPlan[];
	const packages = defaultSubscriptionData.packages as ManaPackage[];

	// Märchenzauber-specific costs
	const maerchenzauberCosts: CostItem[] = [
		{
			action: 'Geschichte erstellen',
			actionKey: 'subscription.cost_create_story',
			cost: 10,
			icon: 'add-circle-outline',
		},
		{
			action: 'Charakter erstellen',
			actionKey: 'subscription.cost_create_character',
			cost: 10,
			icon: 'add-circle-outline',
		},
	];

	// Load credit balance
	async function loadBalance() {
		loading = true;
		error = null;

		try {
			creditBalance = await dataService.getCreditBalance();
		} catch (err) {
			console.error('[Subscription] Failed to load balance:', err);
			error = 'Guthaben konnte nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadBalance();
	});

	// Derived usage data
	const usageData = $derived<UsageData>({
		total: 0,
		lastWeek: 0,
		lastMonth: 0,
		currentMana: creditBalance?.balance ?? 0,
		maxMana: creditBalance?.maxLimit ?? 150,
	});

	// Current plan (for now, default to free - would come from subscription service)
	const currentPlanId = $state('free');
	const currentPlanName = $derived(() => {
		const plan = subscriptions.find((p) => p.id === currentPlanId);
		return plan?.name || 'Free';
	});

	// Get subscription plans for current billing cycle
	function getSubscriptionPlans() {
		return subscriptions.filter((plan) => plan.id !== 'free' && plan.billingCycle === billingCycle);
	}

	// Get free plan
	const freePlan = $derived(subscriptions.find((p) => p.id === 'free'));

	// Check if plan is current
	function isCurrentPlan(planId: string) {
		return planId === currentPlanId;
	}

	// Handle subscription selection
	async function handleSubscribe(planId: string) {
		if (planId === currentPlanId) return;

		processingPayment = true;
		try {
			// TODO: Integrate with payment provider (Stripe, RevenueCat, etc.)
			console.log('[Subscription] Subscribe to plan:', planId);
			alert(
				'Abonnement-Funktionalität wird bald verfügbar sein. Bitte besuchen Sie die mobile App für Käufe.'
			);
		} catch (err) {
			console.error('[Subscription] Failed to subscribe:', err);
		} finally {
			processingPayment = false;
		}
	}

	// Handle package purchase
	async function handleBuyPackage(packageId: string) {
		processingPayment = true;
		try {
			// TODO: Integrate with payment provider
			console.log('[Subscription] Buy package:', packageId);
			alert(
				'Kauf-Funktionalität wird bald verfügbar sein. Bitte besuchen Sie die mobile App für Käufe.'
			);
		} catch (err) {
			console.error('[Subscription] Failed to buy package:', err);
		} finally {
			processingPayment = false;
		}
	}
</script>

<svelte:head>
	<title>Mana | Märchenzauber</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 pb-12">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href="/settings"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Mana kaufen</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Verwalte dein Mana-Guthaben und Abonnement
			</p>
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="space-y-4">
			<div class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			<div class="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-900/20">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button
				onclick={loadBalance}
				class="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
			>
				Erneut versuchen
			</button>
		</div>
	{:else}
		<!-- Usage Card (Custom implementation for theme compatibility) -->
		<section class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Dein Mana</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Aktueller Plan: {currentPlanName()}
					</p>
				</div>
				<div class="rounded-xl bg-gray-100 px-4 py-2 dark:bg-gray-700">
					<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
						{usageData.currentMana}
					</p>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mt-4">
				<div class="relative h-4 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
					<div
						class="h-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-400"
						style="width: {Math.min(
							100,
							Math.round((usageData.currentMana / usageData.maxMana) * 100)
						)}%"
					></div>
				</div>
				<div class="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
					<span>
						{Math.round((usageData.currentMana / usageData.maxMana) * 100)}% verfügbar
					</span>
					<span>
						{usageData.maxMana - usageData.currentMana} verbraucht
					</span>
				</div>
			</div>
		</section>

		<!-- Costs Card -->
		<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
			<h3 class="mb-4 text-lg font-bold text-gray-800 dark:text-gray-200">Mana-Kosten</h3>
			<div class="space-y-3">
				{#each maerchenzauberCosts as item}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<span class="text-gray-600 dark:text-gray-300">{item.action}</span>
						</div>
						<span class="font-semibold text-gray-800 dark:text-gray-200">{item.cost} Mana</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Billing Toggle -->
		<div
			class="flex items-center justify-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800"
		>
			<button
				onclick={() => (billingCycle = 'monthly')}
				class="rounded-xl px-4 py-2 text-sm font-medium transition-all {billingCycle === 'monthly'
					? 'bg-pink-500 text-white'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}"
			>
				Monatlich
			</button>
			<button
				onclick={() => (billingCycle = 'yearly')}
				class="rounded-xl px-4 py-2 text-sm font-medium transition-all {billingCycle === 'yearly'
					? 'bg-pink-500 text-white'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}"
			>
				Jährlich
				<span
					class="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/50 dark:text-green-400"
				>
					-33%
				</span>
			</button>
		</div>

		<!-- Subscriptions Section -->
		<section>
			<h2 class="mb-6 text-xl font-bold text-gray-800 dark:text-gray-200">Abonnements</h2>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Free Plan -->
				{#if freePlan}
					<div
						class="relative rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 {isCurrentPlan(
							'free'
						)
							? 'border-pink-500'
							: 'border-gray-200 dark:border-gray-700'}"
					>
						{#if isCurrentPlan('free')}
							<div
								class="absolute -top-3 left-4 rounded-xl bg-pink-500 px-3 py-1 text-xs font-bold text-white"
							>
								Aktueller Plan
							</div>
						{/if}
						<h3 class="mb-4 text-center text-lg font-bold text-gray-800 dark:text-gray-200">
							{freePlan.name}
						</h3>
						<div class="mb-5 flex justify-between gap-2">
							<div
								class="flex flex-1 flex-col items-center justify-center rounded-xl bg-gray-100 p-3 dark:bg-gray-700"
							>
								<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
									{freePlan.monthlyMana}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">pro Monat</p>
							</div>
							<div
								class="flex flex-1 flex-col items-center justify-center rounded-xl bg-gray-100 p-3 dark:bg-gray-700"
							>
								<p class="text-xl font-bold text-gray-800 dark:text-gray-200">0€</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">kostenlos</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Paid Plans -->
				{#each getSubscriptionPlans() as plan (plan.id)}
					<div
						class="relative rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 {isCurrentPlan(
							plan.id
						)
							? 'border-pink-500'
							: plan.popular
								? 'border-pink-300 dark:border-pink-700'
								: 'border-gray-200 dark:border-gray-700'}"
					>
						{#if isCurrentPlan(plan.id)}
							<div
								class="absolute -top-3 left-4 rounded-xl bg-pink-500 px-3 py-1 text-xs font-bold text-white"
							>
								Aktueller Plan
							</div>
						{:else if plan.popular}
							<div
								class="absolute -top-3 right-4 rounded-xl bg-pink-500 px-3 py-1 text-xs font-bold text-white"
							>
								Beliebt
							</div>
						{/if}
						<h3 class="mb-4 text-center text-lg font-bold text-gray-800 dark:text-gray-200">
							{plan.name}
						</h3>
						<div class="mb-5 flex justify-between gap-2">
							<div
								class="flex flex-1 flex-col items-center justify-center rounded-xl bg-gray-100 p-3 dark:bg-gray-700"
							>
								<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
									{plan.monthlyMana}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">pro Monat</p>
							</div>
							<div
								class="flex flex-1 flex-col items-center justify-center rounded-xl bg-gray-100 p-3 dark:bg-gray-700"
							>
								<p class="text-xl font-bold text-gray-800 dark:text-gray-200">
									{plan.priceString || `${plan.price.toFixed(2).replace('.', ',')}€`}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{plan.billingCycle === 'yearly' ? 'pro Jahr' : 'pro Monat'}
								</p>
								{#if plan.billingCycle === 'yearly' && plan.monthlyEquivalent}
									<p class="text-[10px] text-gray-400 dark:text-gray-500">
										({plan.monthlyEquivalent.toFixed(2).replace('.', ',')}€/Monat)
									</p>
								{/if}
							</div>
						</div>
						<button
							onclick={() => handleSubscribe(plan.id)}
							disabled={isCurrentPlan(plan.id) || processingPayment}
							class="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 {isCurrentPlan(
								plan.id
							)
								? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
								: plan.popular
									? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
									: 'bg-pink-500 text-white hover:bg-pink-600'}"
						>
							{isCurrentPlan(plan.id) ? 'Dein Plan' : 'Kaufen'}
						</button>
					</div>
				{/each}
			</div>
		</section>

		<!-- One-time Purchases Section -->
		<section>
			<h2 class="mb-6 text-xl font-bold text-gray-800 dark:text-gray-200">Einmalkäufe</h2>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each packages as pkg (pkg.id)}
					<div
						class="relative rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 {pkg.popular
							? 'border-pink-300 dark:border-pink-700'
							: 'border-gray-200 dark:border-gray-700'}"
					>
						{#if pkg.popular}
							<div
								class="absolute -top-3 right-4 rounded-xl bg-pink-500 px-3 py-1 text-xs font-bold text-white"
							>
								Beliebt
							</div>
						{/if}
						<h3 class="mb-4 text-center text-lg font-bold text-gray-800 dark:text-gray-200">
							{pkg.name}
						</h3>
						<div class="mb-5 space-y-2">
							<div
								class="flex flex-col items-center justify-center rounded-xl bg-gray-100 p-3 dark:bg-gray-700"
							>
								<p class="text-2xl font-bold text-gray-800 dark:text-gray-200">{pkg.manaAmount}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">Mana</p>
							</div>
							<div class="text-center">
								<p class="text-xl font-bold text-gray-800 dark:text-gray-200">
									{pkg.priceString || `${pkg.price.toFixed(2).replace('.', ',')}€`}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">Einmalig</p>
							</div>
						</div>
						<button
							onclick={() => handleBuyPackage(pkg.id)}
							disabled={processingPayment}
							class="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 {pkg.popular
								? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
								: 'bg-pink-500 text-white hover:bg-pink-600'}"
						>
							Kaufen
						</button>
					</div>
				{/each}
			</div>
		</section>

		<!-- Info Note -->
		<div class="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-900/20">
			<p class="text-sm text-amber-700 dark:text-amber-400">
				Käufe sind derzeit nur über die mobile App verfügbar. Web-Zahlungen kommen bald!
			</p>
		</div>
	{/if}
</div>
