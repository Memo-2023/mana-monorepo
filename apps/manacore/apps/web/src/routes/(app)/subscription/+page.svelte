<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card, PageHeader } from '@manacore/shared-ui';
	import { Check } from '@manacore/shared-icons';
	import {
		subscriptionsService,
		type SubscriptionPlan,
		type CurrentSubscription,
		type Invoice,
	} from '$lib/api/subscriptions';

	let plans = $state<SubscriptionPlan[]>([]);
	let currentSubscription = $state<CurrentSubscription | null>(null);
	let invoices = $state<Invoice[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'plans' | 'billing' | 'invoices'>('plans');
	let billingInterval = $state<'month' | 'year'>('month');
	let processingPlanId = $state<string | null>(null);
	let cancelingSubscription = $state(false);
	let reactivatingSubscription = $state(false);
	let openingPortal = $state(false);

	// Toast notification
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Handle success/canceled from Stripe redirect
	$effect(() => {
		const success = $page.url.searchParams.get('success');
		const canceled = $page.url.searchParams.get('canceled');

		if (success === 'true') {
			showToast('Abonnement erfolgreich abgeschlossen!', 'success');
			// Reload data
			loadData();
			// Clean URL
			window.history.replaceState({}, '', '/subscription');
		} else if (canceled === 'true') {
			showToast('Checkout wurde abgebrochen', 'error');
			window.history.replaceState({}, '', '/subscription');
		}
	});

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;
		try {
			const [plansData, subscriptionData, invoicesData] = await Promise.all([
				subscriptionsService.getPlans(),
				subscriptionsService.getCurrentSubscription(),
				subscriptionsService.getInvoices(10),
			]);
			plans = plansData.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
			currentSubscription = subscriptionData;
			invoices = invoicesData;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Daten';
			console.error('Failed to load subscription data:', e);
		} finally {
			loading = false;
		}
	}

	function formatPrice(cents: number, interval: 'month' | 'year'): string {
		const amount = cents / 100;
		return amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	function formatMonthlyEquivalent(yearlyCents: number): string {
		const monthlyAmount = yearlyCents / 12 / 100;
		return monthlyAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getStatusBadge(status: string): { text: string; class: string } {
		switch (status) {
			case 'active':
				return {
					text: 'Aktiv',
					class: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
				};
			case 'canceled':
				return {
					text: 'Gekündigt',
					class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
				};
			case 'past_due':
				return {
					text: 'Überfällig',
					class: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
				};
			case 'trialing':
				return {
					text: 'Testphase',
					class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
				};
			default:
				return {
					text: status,
					class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
				};
		}
	}

	function getSavingsPercent(monthly: number, yearly: number): number {
		const yearlyFromMonthly = monthly * 12;
		if (yearlyFromMonthly === 0) return 0;
		return Math.round(((yearlyFromMonthly - yearly) / yearlyFromMonthly) * 100);
	}

	async function handleSelectPlan(plan: SubscriptionPlan) {
		if (plan.isDefault) return; // Free plan, no checkout needed

		processingPlanId = plan.id;
		try {
			const { url } = await subscriptionsService.createCheckout(plan.id, billingInterval);
			window.location.href = url;
		} catch (e) {
			showToast(
				e instanceof Error ? e.message : 'Fehler beim Erstellen der Checkout-Session',
				'error'
			);
		} finally {
			processingPlanId = null;
		}
	}

	async function handleOpenPortal() {
		openingPortal = true;
		try {
			const { url } = await subscriptionsService.openPortal();
			window.location.href = url;
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Öffnen des Billing-Portals', 'error');
		} finally {
			openingPortal = false;
		}
	}

	async function handleCancelSubscription() {
		if (
			!confirm(
				'Möchtest du dein Abonnement wirklich kündigen? Du kannst es bis zum Ende der Laufzeit weiter nutzen.'
			)
		) {
			return;
		}

		cancelingSubscription = true;
		try {
			await subscriptionsService.cancelSubscription();
			showToast('Abonnement wird zum Ende der Laufzeit gekündigt', 'success');
			await loadData();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Kündigen', 'error');
		} finally {
			cancelingSubscription = false;
		}
	}

	async function handleReactivateSubscription() {
		reactivatingSubscription = true;
		try {
			await subscriptionsService.reactivateSubscription();
			showToast('Abonnement wurde reaktiviert', 'success');
			await loadData();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Reaktivieren', 'error');
		} finally {
			reactivatingSubscription = false;
		}
	}

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}
</script>

<div>
	<PageHeader
		title="Abonnement"
		description="Verwalte dein Abonnement und sieh dir deine Rechnungen an"
		size="lg"
	/>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if error}
		<Card>
			<div class="text-center py-8">
				<p class="text-red-500 mb-4">{error}</p>
				<button
					onclick={loadData}
					class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
				>
					Erneut versuchen
				</button>
			</div>
		</Card>
	{:else}
		<!-- Current Subscription Status -->
		{#if currentSubscription?.subscription}
			{@const sub = currentSubscription.subscription}
			{@const plan = currentSubscription.plan}
			{@const status = getStatusBadge(sub.status)}
			<Card>
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
					<div>
						<div class="flex items-center gap-3">
							<h2 class="text-xl font-bold">{plan?.name || 'Aktueller Plan'}</h2>
							<span class="px-2 py-0.5 text-xs font-medium rounded-full {status.class}">
								{status.text}
							</span>
						</div>
						<p class="text-sm text-muted-foreground mt-1">
							{plan?.monthlyCredits.toLocaleString('de-DE')} Mana / Monat
						</p>
					</div>
					<div class="flex gap-2">
						<button
							onclick={handleOpenPortal}
							disabled={openingPortal}
							class="px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
						>
							{#if openingPortal}
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{/if}
							Zahlungsmethode verwalten
						</button>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border">
					<div>
						<p class="text-sm text-muted-foreground">Abrechnungszeitraum</p>
						<p class="font-medium">{sub.billingInterval === 'year' ? 'Jährlich' : 'Monatlich'}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Aktuelle Periode</p>
						<p class="font-medium">
							{formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
						</p>
					</div>
					<div>
						{#if sub.cancelAtPeriodEnd}
							<p class="text-sm text-muted-foreground">Endet am</p>
							<p class="font-medium text-yellow-600">{formatDate(sub.currentPeriodEnd)}</p>
							<button
								onclick={handleReactivateSubscription}
								disabled={reactivatingSubscription}
								class="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
							>
								{reactivatingSubscription ? 'Wird reaktiviert...' : 'Reaktivieren'}
							</button>
						{:else}
							<p class="text-sm text-muted-foreground">Verlängert am</p>
							<p class="font-medium">{formatDate(sub.currentPeriodEnd)}</p>
							<button
								onclick={handleCancelSubscription}
								disabled={cancelingSubscription}
								class="mt-2 text-sm text-red-500 hover:underline disabled:opacity-50"
							>
								{cancelingSubscription ? 'Wird gekündigt...' : 'Kündigen'}
							</button>
						{/if}
					</div>
				</div>
			</Card>
		{:else}
			<!-- Free Plan Info -->
			<Card>
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<div class="flex items-center gap-3">
							<h2 class="text-xl font-bold">Free Plan</h2>
							<span
								class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
							>
								Aktuell
							</span>
						</div>
						<p class="text-sm text-muted-foreground mt-1">150 Mana / Monat</p>
					</div>
					<p class="text-sm text-muted-foreground">
						Upgrade auf einen bezahlten Plan für mehr Mana und Features.
					</p>
				</div>
			</Card>
		{/if}

		<!-- Tabs -->
		<div class="flex gap-2 mt-8 mb-6 border-b border-border">
			<button
				onclick={() => (activeTab = 'plans')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'plans'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Pläne
			</button>
			<button
				onclick={() => (activeTab = 'invoices')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'invoices'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Rechnungen
			</button>
		</div>

		<!-- Tab Content -->
		{#if activeTab === 'plans'}
			<!-- Billing Interval Toggle -->
			<div class="flex justify-center mb-8">
				<div class="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
					<button
						onclick={() => (billingInterval = 'month')}
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors {billingInterval ===
						'month'
							? 'bg-background shadow-sm'
							: 'hover:text-foreground'}"
					>
						Monatlich
					</button>
					<button
						onclick={() => (billingInterval = 'year')}
						class="px-4 py-2 rounded-md text-sm font-medium transition-colors {billingInterval ===
						'year'
							? 'bg-background shadow-sm'
							: 'hover:text-foreground'}"
					>
						Jährlich
						<span class="ml-1 text-xs text-green-600">Spare 17%</span>
					</button>
				</div>
			</div>

			<!-- Plans Grid -->
			<div class="grid gap-6 md:grid-cols-3">
				{#each plans as plan}
					{@const isCurrentPlan = currentSubscription?.plan?.id === plan.id}
					{@const price =
						billingInterval === 'year' ? plan.priceYearlyEuroCents : plan.priceMonthlyEuroCents}
					{@const savings = getSavingsPercent(
						plan.priceMonthlyEuroCents,
						plan.priceYearlyEuroCents
					)}
					<Card>
						<div class="text-center p-2">
							{#if isCurrentPlan}
								<span
									class="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4"
								>
									Dein Plan
								</span>
							{/if}

							<h3 class="text-xl font-bold">{plan.name}</h3>
							{#if plan.description}
								<p class="text-sm text-muted-foreground mt-1">{plan.description}</p>
							{/if}

							<div class="mt-6">
								<span class="text-4xl font-bold">
									{plan.isDefault ? 'Kostenlos' : formatPrice(price, billingInterval)}
								</span>
								{#if !plan.isDefault}
									<span class="text-muted-foreground">
										/ {billingInterval === 'year' ? 'Jahr' : 'Monat'}
									</span>
									{#if billingInterval === 'year' && savings > 0}
										<p class="text-sm text-green-600 mt-1">
											{formatMonthlyEquivalent(plan.priceYearlyEuroCents)} / Monat
										</p>
									{/if}
								{/if}
							</div>

							<p class="text-lg font-semibold text-primary mt-4">
								{plan.monthlyCredits.toLocaleString('de-DE')} Mana / Monat
							</p>

							{#if plan.features && plan.features.length > 0}
								<ul class="mt-6 space-y-3 text-left">
									{#each plan.features as feature}
										<li class="flex items-start gap-2 text-sm">
											<Check size={20} class="text-green-500 flex-shrink-0" />
											<span>{feature}</span>
										</li>
									{/each}
								</ul>
							{/if}

							<button
								onclick={() => handleSelectPlan(plan)}
								disabled={isCurrentPlan || processingPlanId === plan.id || plan.isDefault}
								class="mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
									{isCurrentPlan || plan.isDefault
									? 'bg-muted text-muted-foreground'
									: 'bg-primary text-primary-foreground hover:bg-primary/90'}"
							>
								{#if processingPlanId === plan.id}
									<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Wird verarbeitet...
								{:else if isCurrentPlan}
									Aktueller Plan
								{:else if plan.isDefault}
									Kostenlos
								{:else}
									Auswählen
								{/if}
							</button>
						</div>
					</Card>
				{/each}
			</div>
		{:else if activeTab === 'invoices'}
			<Card>
				<h3 class="text-lg font-semibold mb-4">Rechnungsverlauf</h3>
				{#if invoices.length === 0}
					<p class="text-muted-foreground text-center py-8">Noch keine Rechnungen vorhanden.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-border text-left text-sm text-muted-foreground">
									<th class="pb-3 pr-4">Nummer</th>
									<th class="pb-3 pr-4">Datum</th>
									<th class="pb-3 pr-4">Zeitraum</th>
									<th class="pb-3 pr-4 text-right">Betrag</th>
									<th class="pb-3 pr-4">Status</th>
									<th class="pb-3"></th>
								</tr>
							</thead>
							<tbody>
								{#each invoices as invoice}
									<tr class="border-b border-border last:border-0">
										<td class="py-3 pr-4 font-mono text-sm">{invoice.number || '-'}</td>
										<td class="py-3 pr-4 text-sm">{formatDate(invoice.createdAt)}</td>
										<td class="py-3 pr-4 text-sm text-muted-foreground">
											{#if invoice.periodStart && invoice.periodEnd}
												{formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
											{:else}
												-
											{/if}
										</td>
										<td class="py-3 pr-4 text-right font-medium">
											{formatPrice(invoice.amountPaidEuroCents, 'month')}
										</td>
										<td class="py-3 pr-4">
											{#if invoice.status === 'paid'}
												<span
													class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
												>
													Bezahlt
												</span>
											{:else}
												<span
													class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
												>
													{invoice.status}
												</span>
											{/if}
										</td>
										<td class="py-3">
											{#if invoice.invoicePdfUrl}
												<a
													href={invoice.invoicePdfUrl}
													target="_blank"
													rel="noopener noreferrer"
													class="text-sm text-primary hover:underline"
												>
													PDF
												</a>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card>
		{/if}
	{/if}
</div>

<!-- Toast Notification -->
{#if toastMessage}
	<div
		class="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-fade-in {toastType ===
		'success'
			? 'bg-green-600 text-white'
			: 'bg-red-600 text-white'}"
	>
		{toastMessage}
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>
