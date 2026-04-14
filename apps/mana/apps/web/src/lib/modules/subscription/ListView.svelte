<!--
  Subscription — Workbench-embedded subscription management with plan
  selection, current status, billing interval toggle, and invoice history.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { Check } from '@mana/shared-icons';
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
	let activeTab = $state<'plans' | 'invoices'>('plans');
	let billingInterval = $state<'month' | 'year'>('month');
	let processingPlanId = $state<string | null>(null);
	let cancelingSubscription = $state(false);
	let reactivatingSubscription = $state(false);
	let openingPortal = $state(false);

	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

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
			error = e instanceof Error ? e.message : $_('common.error_loading');
		} finally {
			loading = false;
		}
	}

	function formatPrice(cents: number): string {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	function formatMonthlyEquivalent(yearlyCents: number): string {
		return (yearlyCents / 12 / 100).toLocaleString('de-DE', {
			style: 'currency',
			currency: 'EUR',
		});
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getStatusLabel(status: string): string {
		const map: Record<string, string> = {
			active: 'Aktiv',
			canceled: 'Gekündigt',
			past_due: 'Überfällig',
			trialing: 'Testphase',
		};
		return map[status] || status;
	}

	function getSavingsPercent(monthly: number, yearly: number): number {
		const full = monthly * 12;
		if (full === 0) return 0;
		return Math.round(((full - yearly) / full) * 100);
	}

	async function handleSelectPlan(plan: SubscriptionPlan) {
		if (plan.isDefault) return;
		processingPlanId = plan.id;
		try {
			const { url } = await subscriptionsService.createCheckout(plan.id, billingInterval);
			window.location.href = url;
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Checkout', 'error');
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
			showToast(e instanceof Error ? e.message : 'Fehler beim Billing-Portal', 'error');
		} finally {
			openingPortal = false;
		}
	}

	async function handleCancelSubscription() {
		if (!confirm('Möchtest du dein Abonnement wirklich kündigen?')) return;
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
		setTimeout(() => (toastMessage = null), 4000);
	}
</script>

<div class="sub-page">
	{#if loading}
		<div class="loading"><div class="spinner"></div></div>
	{:else if error}
		<div class="error-box">
			<p>{error}</p>
			<button class="retry-btn" onclick={loadData}>Erneut versuchen</button>
		</div>
	{:else}
		<!-- Current Subscription -->
		{#if currentSubscription?.subscription}
			{@const sub = currentSubscription.subscription}
			{@const plan = currentSubscription.plan}
			<div class="status-card">
				<div class="status-header">
					<div>
						<div class="status-title-row">
							<span class="plan-name">{plan?.name || 'Aktueller Plan'}</span>
							<span
								class="status-badge"
								class:active={sub.status === 'active'}
								class:canceled={sub.status === 'canceled'}
								class:past-due={sub.status === 'past_due'}
							>
								{getStatusLabel(sub.status)}
							</span>
						</div>
						<span class="plan-credits">
							{plan?.monthlyCredits.toLocaleString('de-DE')} Mana / Monat
						</span>
					</div>
					<button class="portal-btn" disabled={openingPortal} onclick={handleOpenPortal}>
						{openingPortal ? '...' : 'Zahlungsmethode'}
					</button>
				</div>
				<div class="status-details">
					<div class="detail">
						<span class="detail-label">Zeitraum</span>
						<span>{sub.billingInterval === 'year' ? 'Jährlich' : 'Monatlich'}</span>
					</div>
					<div class="detail">
						<span class="detail-label">Periode</span>
						<span>{formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</span>
					</div>
					<div class="detail">
						{#if sub.cancelAtPeriodEnd}
							<span class="detail-label">Endet am</span>
							<span class="text-warn">{formatDate(sub.currentPeriodEnd)}</span>
							<button
								class="link-btn"
								disabled={reactivatingSubscription}
								onclick={handleReactivateSubscription}
							>
								{reactivatingSubscription ? '...' : 'Reaktivieren'}
							</button>
						{:else}
							<span class="detail-label">Verlängert am</span>
							<span>{formatDate(sub.currentPeriodEnd)}</span>
							<button
								class="link-btn danger"
								disabled={cancelingSubscription}
								onclick={handleCancelSubscription}
							>
								{cancelingSubscription ? '...' : 'Kündigen'}
							</button>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="status-card">
				<div class="status-title-row">
					<span class="plan-name">Free Plan</span>
					<span class="status-badge active">Aktuell</span>
				</div>
				<span class="plan-credits">150 Mana / Monat</span>
			</div>
		{/if}

		<!-- Tabs -->
		<div class="tabs">
			<button class="tab" class:active={activeTab === 'plans'} onclick={() => (activeTab = 'plans')}
				>Pläne</button
			>
			<button
				class="tab"
				class:active={activeTab === 'invoices'}
				onclick={() => (activeTab = 'invoices')}>Rechnungen</button
			>
		</div>

		{#if activeTab === 'plans'}
			<!-- Billing toggle -->
			<div class="interval-toggle">
				<button
					class="interval-btn"
					class:selected={billingInterval === 'month'}
					onclick={() => (billingInterval = 'month')}>Monatlich</button
				>
				<button
					class="interval-btn"
					class:selected={billingInterval === 'year'}
					onclick={() => (billingInterval = 'year')}
				>
					Jährlich <span class="save-tag">–17%</span>
				</button>
			</div>

			<!-- Plans -->
			<div class="plans-list">
				{#each plans as plan}
					{@const isCurrent = currentSubscription?.plan?.id === plan.id}
					{@const price =
						billingInterval === 'year' ? plan.priceYearlyEuroCents : plan.priceMonthlyEuroCents}
					<div class="plan-card" class:current={isCurrent}>
						{#if isCurrent}<span class="current-tag">Dein Plan</span>{/if}
						<span class="plan-card-name">{plan.name}</span>
						{#if plan.description}
							<span class="plan-desc">{plan.description}</span>
						{/if}
						<div class="plan-price">
							<span class="price-amount">
								{plan.isDefault ? 'Kostenlos' : formatPrice(price)}
							</span>
							{#if !plan.isDefault}
								<span class="price-period">/ {billingInterval === 'year' ? 'Jahr' : 'Monat'}</span>
								{#if billingInterval === 'year'}
									<span class="price-monthly"
										>{formatMonthlyEquivalent(plan.priceYearlyEuroCents)} / Monat</span
									>
								{/if}
							{/if}
						</div>
						<span class="plan-mana">
							{plan.monthlyCredits.toLocaleString('de-DE')} Mana / Monat
						</span>
						{#if plan.features?.length}
							<ul class="features">
								{#each plan.features as feature}
									<li><Check size={14} /> {feature}</li>
								{/each}
							</ul>
						{/if}
						<button
							class="select-btn"
							class:disabled={isCurrent || plan.isDefault}
							disabled={isCurrent || processingPlanId === plan.id || plan.isDefault}
							onclick={() => handleSelectPlan(plan)}
						>
							{#if processingPlanId === plan.id}
								...
							{:else if isCurrent}
								Aktuell
							{:else if plan.isDefault}
								Kostenlos
							{:else}
								Auswählen
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Invoices -->
			<div class="invoices">
				{#if invoices.length === 0}
					<p class="empty">Noch keine Rechnungen vorhanden.</p>
				{:else}
					{#each invoices as inv}
						<div class="invoice-row">
							<div class="invoice-info">
								<span class="invoice-number">{inv.number || '-'}</span>
								<span class="invoice-date">{formatDate(inv.createdAt)}</span>
							</div>
							<div class="invoice-right">
								<span class="invoice-amount">{formatPrice(inv.amountPaidEuroCents)}</span>
								<span class="invoice-status" class:paid={inv.status === 'paid'}>
									{inv.status === 'paid' ? 'Bezahlt' : inv.status}
								</span>
								{#if inv.invoicePdfUrl}
									<a
										href={inv.invoicePdfUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="pdf-link">PDF</a
									>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if toastMessage}
	<div class="toast" class:error={toastType === 'error'}>{toastMessage}</div>
{/if}

<style>
	.sub-page {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 0;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-box {
		text-align: center;
		padding: 2rem;
	}

	.error-box p {
		color: hsl(0 84% 60%);
		font-size: 0.8125rem;
		margin-bottom: 0.75rem;
	}

	.retry-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	/* Status card */
	.status-card {
		padding: 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.status-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.status-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.plan-name {
		font-size: 0.9375rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.status-badge {
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
	}

	.status-badge.active {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 45%);
	}

	.status-badge.canceled {
		background: hsl(45 93% 47% / 0.12);
		color: hsl(45 93% 47%);
	}

	.status-badge.past-due {
		background: hsl(0 84% 60% / 0.12);
		color: hsl(0 84% 60%);
	}

	.plan-credits {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.portal-btn {
		flex-shrink: 0;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.6875rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
	}

	.portal-btn:hover {
		background: hsl(var(--color-surface-hover));
	}

	.status-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.detail-label {
		color: hsl(var(--color-muted-foreground));
		min-width: 5rem;
	}

	.text-warn {
		color: hsl(45 93% 47%);
	}

	.link-btn {
		background: none;
		border: none;
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		cursor: pointer;
		text-decoration: underline;
	}

	.link-btn.danger {
		color: hsl(0 84% 60%);
	}

	.link-btn:disabled {
		opacity: 0.5;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.tab {
		padding: 0.5rem 0.75rem;
		border: none;
		background: none;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}

	.tab.active {
		color: hsl(var(--color-primary));
		border-bottom-color: hsl(var(--color-primary));
	}

	/* Interval toggle */
	.interval-toggle {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
		padding: 0.25rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.5rem;
	}

	.interval-btn {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}

	.interval-btn.selected {
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.08);
	}

	.save-tag {
		font-size: 0.625rem;
		color: hsl(142 71% 45%);
	}

	/* Plans */
	.plans-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.plan-card {
		padding: 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.plan-card.current {
		border-color: hsl(var(--color-primary) / 0.35);
	}

	.current-tag {
		font-size: 0.625rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		align-self: flex-start;
	}

	.plan-card-name {
		font-size: 0.9375rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.plan-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.price-amount {
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.price-period {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.price-monthly {
		font-size: 0.6875rem;
		color: hsl(142 71% 45%);
	}

	.plan-mana {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
	}

	.features {
		list-style: none;
		padding: 0;
		margin: 0.375rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.features li {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}

	.features li :global(svg) {
		color: hsl(142 71% 45%);
		flex-shrink: 0;
	}

	.select-btn {
		margin-top: 0.5rem;
		padding: 0.5rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.select-btn:hover {
		opacity: 0.9;
	}

	.select-btn.disabled {
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
		cursor: not-allowed;
	}

	/* Invoices */
	.invoices {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		padding: 2rem;
	}

	.invoice-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}

	.invoice-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.invoice-number {
		font-family: monospace;
		font-size: 0.75rem;
	}

	.invoice-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.invoice-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.invoice-amount {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.invoice-status {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		background: hsl(45 93% 47% / 0.12);
		color: hsl(45 93% 47%);
	}

	.invoice-status.paid {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 45%);
	}

	.pdf-link {
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
	}

	.pdf-link:hover {
		text-decoration: underline;
	}

	/* Toast */
	.toast {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 50;
		padding: 0.75rem 1rem;
		background: hsl(142 71% 45%);
		color: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.15);
		font-size: 0.875rem;
		animation: fade-in 0.2s ease-out;
	}

	.toast.error {
		background: hsl(0 84% 60%);
	}

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
</style>
