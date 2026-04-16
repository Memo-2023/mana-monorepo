<!--
  Credits & Abo — Workbench-embedded billing hub. Single place for
  balance, subscription management, credit purchases, transactions,
  and cost breakdown.

  Stripe redirect handling: after checkout Stripe sends the user back
  to /?app=credits&success=true (or &canceled=true). The workbench
  deep-link handler opens this app and strips ?app, leaving ?success=
  in the URL for us to read here.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { Card } from '@mana/shared-ui';
	import { Check } from '@mana/shared-icons';
	import {
		creditsService,
		type CreditBalance,
		type CreditTransaction,
		type CreditPackage,
	} from '$lib/api/credits';
	import {
		subscriptionsService,
		type SubscriptionPlan,
		type CurrentSubscription,
		type Invoice,
	} from '$lib/api/subscriptions';
	import {
		OPERATION_METADATA,
		CREDIT_COSTS,
		CreditCategory,
		formatCreditCost,
		type CreditOperationType,
	} from '@mana/credits';
	import { ManaEvents } from '@mana/shared-utils/analytics';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	// ── Credits state ──────────────────────────────────────
	let balance = $state<CreditBalance | null>(null);
	let transactions = $state<CreditTransaction[]>([]);
	let packages = $state<CreditPackage[]>([]);

	// ── Subscription state ─────────────────────────────────
	let subPlans = $state<SubscriptionPlan[]>([]);
	let currentSub = $state<CurrentSubscription | null>(null);
	let invoices = $state<Invoice[]>([]);
	let billingInterval = $state<'month' | 'year'>('month');
	let processingPlanId = $state<string | null>(null);
	let cancelingSub = $state(false);
	let reactivatingSub = $state(false);
	let openingPortal = $state(false);

	// ── Shared state ───────────────────────────────────────
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'subscriptions' | 'transactions' | 'packages' | 'costs'>(
		'overview'
	);
	let costFilter = $state<'all' | 'ai' | 'premium'>('all');
	let processingPackageId = $state<string | null>(null);

	// ── Derived pricing data ───────────────────────────────
	const allOperations = $derived(
		Object.entries(OPERATION_METADATA).map(([op, meta]) => ({
			operation: op as CreditOperationType,
			name: meta.name,
			description: meta.description,
			category: meta.category,
			app: meta.app,
			cost: CREDIT_COSTS[op as CreditOperationType],
			formattedCost: formatCreditCost(CREDIT_COSTS[op as CreditOperationType]),
		}))
	);

	const filteredOperations = $derived(
		costFilter === 'all'
			? allOperations
			: allOperations.filter((op) => {
					if (costFilter === 'ai') return op.category === CreditCategory.AI;
					if (costFilter === 'premium') return op.category === CreditCategory.PREMIUM;
					return true;
				})
	);

	const operationsByApp = $derived(() => {
		const groups: Record<string, typeof filteredOperations> = {};
		for (const op of filteredOperations) {
			if (!groups[op.app]) groups[op.app] = [];
			groups[op.app].push(op);
		}
		return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
	});

	const APP_LABELS: Record<string, string> = {
		calendar: 'Kalender',
		chat: 'Chat',
		contacts: 'Kontakte',
		context: 'Context',
		general: 'Allgemein',
		cards: 'Cards',
		food: 'Food',
		picture: 'Picture',
		plants: 'Plants',
		presi: 'Presi',
		questions: 'Questions',
		skilltree: 'SkillTree',
		todo: 'Todo',
		traces: 'Traces',
		quotes: 'Quotes',
	};

	function getAppLabel(app: string): string {
		return APP_LABELS[app] ?? app.charAt(0).toUpperCase() + app.slice(1);
	}

	function getCategoryLabel(category: CreditCategory): string {
		switch (category) {
			case CreditCategory.AI:
				return 'KI-Features';
			case CreditCategory.PREMIUM:
				return 'Premium';
			default:
				return category;
		}
	}

	// ── Lifecycle ──────────────────────────────────────────
	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		const tab = params.get('tab');
		if (tab === 'packages') activeTab = 'packages';
		else if (tab === 'transactions') activeTab = 'transactions';
		else if (tab === 'costs') activeTab = 'costs';
		else if (tab === 'subscriptions') activeTab = 'subscriptions';

		const success = params.get('success');
		const canceled = params.get('canceled');

		if (success === 'true') {
			toast.success('Credits erfolgreich gekauft!');
			history.replaceState({}, '', '/');
		} else if (canceled === 'true') {
			toast.error('Kauf wurde abgebrochen');
			history.replaceState({}, '', '/');
		}

		if (activeTab !== 'overview') ManaEvents.creditsTabViewed(activeTab);
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		if (!authStore.isAuthenticated) {
			loading = false;
			return;
		}

		const results = await Promise.allSettled([
			creditsService.getBalance(),
			creditsService.getTransactions(20),
			creditsService.getPackages(),
			subscriptionsService.getPlans(),
			subscriptionsService.getCurrentSubscription(),
			subscriptionsService.getInvoices(10),
		]);

		if (results[0].status === 'fulfilled') balance = results[0].value;
		if (results[1].status === 'fulfilled') transactions = results[1].value;
		if (results[2].status === 'fulfilled') {
			packages = results[2].value.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
		}
		if (results[3].status === 'fulfilled') {
			subPlans = results[3].value.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
		}
		if (results[4].status === 'fulfilled') currentSub = results[4].value;
		if (results[5].status === 'fulfilled') invoices = results[5].value;

		const allFailed = results.every((r) => r.status === 'rejected');
		if (allFailed) {
			const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
			error =
				firstErr.reason instanceof Error ? firstErr.reason.message : $_('common.error_loading');
		}

		loading = false;
	}

	// ── Credit helpers ─────────────────────────────────────
	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	function formatPrice(cents: number): string {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatDateShort(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getTransactionIcon(type: string): string {
		switch (type) {
			case 'purchase':
				return '💳';
			case 'usage':
				return '⚡';
			case 'refund':
				return '↩️';
			case 'gift':
				return '🎁';
			default:
				return '📝';
		}
	}

	function getTransactionColor(type: string): string {
		switch (type) {
			case 'purchase':
			case 'gift':
			case 'refund':
				return 'text-green-600 dark:text-green-400';
			case 'usage':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-muted-foreground';
		}
	}

	// ── Credit actions ─────────────────────────────────────
	async function handleBuyPackage(pkg: CreditPackage) {
		processingPackageId = pkg.id;
		try {
			const result = await creditsService.initiatePurchase(pkg.id);
			window.location.href = result.checkoutUrl;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Fehler beim Erstellen der Checkout-Session');
		} finally {
			processingPackageId = null;
		}
	}

	// ── Subscription helpers ───────────────────────────────
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

	// ── Subscription actions ───────────────────────────────
	async function handleSelectPlan(plan: SubscriptionPlan) {
		if (plan.isDefault) return;
		processingPlanId = plan.id;
		try {
			const { url } = await subscriptionsService.createCheckout(plan.id, billingInterval);
			window.location.href = url;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Fehler beim Checkout');
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
			toast.error(e instanceof Error ? e.message : 'Fehler beim Billing-Portal');
		} finally {
			openingPortal = false;
		}
	}

	async function handleCancelSub() {
		if (!confirm('Möchtest du dein Abonnement wirklich kündigen?')) return;
		cancelingSub = true;
		try {
			await subscriptionsService.cancelSubscription();
			toast.success('Abo erfolgreich gekündigt');
			await loadData();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Fehler beim Kündigen');
		} finally {
			cancelingSub = false;
		}
	}

	async function handleReactivateSub() {
		reactivatingSub = true;
		try {
			await subscriptionsService.reactivateSubscription();
			toast.success('Abo erfolgreich reaktiviert');
			await loadData();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Fehler beim Reaktivieren');
		} finally {
			reactivatingSub = false;
		}
	}
</script>

<div class="credits-page">
	{#if loading}
		<div class="loading"><div class="spinner"></div></div>
	{:else if error}
		<Card>
			<div class="text-center py-8">
				<p class="text-error mb-4">{error}</p>
				<button onclick={loadData} class="btn btn-primary">Erneut versuchen</button>
			</div>
		</Card>
	{:else}
		<!-- Balance Overview -->
		<div class="balance-grid">
			<div class="balance-card">
				<p class="balance-label">Verfügbar</p>
				<p class="balance-value primary">{formatCredits(balance?.balance ?? 0)}</p>
			</div>
			<div class="balance-card">
				<p class="balance-label">Erhalten</p>
				<p class="balance-value">{formatCredits(balance?.totalEarned ?? 0)}</p>
			</div>
			<div class="balance-card">
				<p class="balance-label">Verbraucht</p>
				<p class="balance-value">{formatCredits(balance?.totalSpent ?? 0)}</p>
			</div>
		</div>

		<!-- Tabs -->
		<div class="tab-bar">
			{#each [{ key: 'overview', label: 'Übersicht' }, { key: 'subscriptions', label: 'Abo' }, { key: 'transactions', label: 'Verlauf' }, { key: 'packages', label: 'Kaufen' }, { key: 'costs', label: 'Kosten' }] as tab}
				<button
					onclick={() => (activeTab = tab.key as typeof activeTab)}
					class="tab-btn"
					class:active={activeTab === tab.key}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- ── Tab: Übersicht ──────────────────────────────── -->
		{#if activeTab === 'overview'}
			<div class="overview-grid">
				<Card>
					<h3 class="card-title">Letzte Transaktionen</h3>
					{#if transactions.length === 0}
						<p class="empty-hint">Noch keine Transaktionen</p>
					{:else}
						<div class="tx-list">
							{#each transactions.slice(0, 5) as tx}
								<div class="tx-row">
									<div class="tx-left">
										<span class="tx-icon">{getTransactionIcon(tx.type)}</span>
										<div>
											<p class="tx-desc">{tx.description || tx.type}</p>
											<p class="tx-date">{formatDate(tx.createdAt)}</p>
										</div>
									</div>
									<span class="tx-amount {getTransactionColor(tx.type)}">
										{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
									</span>
								</div>
							{/each}
						</div>
						<button onclick={() => (activeTab = 'transactions')} class="link-btn">
							Alle anzeigen →
						</button>
					{/if}
				</Card>

				<Card>
					<h3 class="card-title">Credits kaufen</h3>
					{#if packages.length === 0}
						<p class="empty-hint">Keine Pakete verfügbar</p>
					{:else}
						<div class="quick-buy">
							{#each packages.slice(0, 3) as pkg}
								<button
									onclick={() => handleBuyPackage(pkg)}
									disabled={processingPackageId === pkg.id}
									class="quick-buy-btn"
								>
									<div>
										<p class="pkg-name">{pkg.name}</p>
										<p class="pkg-credits">{formatCredits(pkg.credits)} Credits</p>
									</div>
									<span class="pkg-price">{formatPrice(pkg.priceEuroCents)}</span>
								</button>
							{/each}
						</div>
						<button onclick={() => (activeTab = 'packages')} class="link-btn">
							Alle Pakete →
						</button>
					{/if}
				</Card>
			</div>

			<!-- ── Tab: Abonnements ─────────────────────────── -->
		{:else if activeTab === 'subscriptions'}
			<!-- Current subscription status -->
			{#if currentSub?.subscription}
				{@const sub = currentSub.subscription}
				{@const plan = currentSub.plan}
				<div class="status-card">
					<div class="status-header">
						<div>
							<div class="status-title-row">
								<span class="sub-plan-name">{plan?.name || 'Aktueller Plan'}</span>
								<span
									class="status-badge"
									class:active={sub.status === 'active'}
									class:canceled={sub.status === 'canceled'}
								>
									{getStatusLabel(sub.status)}
								</span>
							</div>
							<span class="sub-mana">
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
							<span>
								{formatDateShort(sub.currentPeriodStart)} – {formatDateShort(sub.currentPeriodEnd)}
							</span>
						</div>
						<div class="detail">
							{#if sub.cancelAtPeriodEnd}
								<span class="detail-label">Endet am</span>
								<span class="text-warn">{formatDateShort(sub.currentPeriodEnd)}</span>
								<button class="link-btn" disabled={reactivatingSub} onclick={handleReactivateSub}>
									{reactivatingSub ? '...' : 'Reaktivieren'}
								</button>
							{:else}
								<span class="detail-label">Verlängert am</span>
								<span>{formatDateShort(sub.currentPeriodEnd)}</span>
								<button class="link-btn danger" disabled={cancelingSub} onclick={handleCancelSub}>
									{cancelingSub ? '...' : 'Kündigen'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="status-card">
					<div class="status-title-row">
						<span class="sub-plan-name">Free Plan</span>
						<span class="status-badge active">Aktuell</span>
					</div>
					<span class="sub-mana">150 Mana / Monat</span>
				</div>
			{/if}

			<!-- Billing interval toggle -->
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

			<!-- Plans list -->
			<div class="plans-list">
				{#each subPlans as plan}
					{@const isCurrent = currentSub?.plan?.id === plan.id}
					{@const price =
						billingInterval === 'year' ? plan.priceYearlyEuroCents : plan.priceMonthlyEuroCents}
					<button
						class="plan-row"
						class:current={isCurrent}
						disabled={isCurrent || plan.isDefault || processingPlanId === plan.id}
						onclick={() => handleSelectPlan(plan)}
					>
						<div class="plan-info">
							<span class="plan-row-name">
								{plan.name}
								{#if isCurrent}<span class="current-tag">Dein Plan</span>{/if}
							</span>
							<span class="plan-row-mana"
								>{plan.monthlyCredits.toLocaleString('de-DE')} Mana / Monat</span
							>
							{#if plan.features?.length}
								<span class="plan-features-preview">
									{plan.features.slice(0, 2).join(' · ')}
								</span>
							{/if}
						</div>
						<div class="plan-price-col">
							{#if plan.isDefault}
								<span class="plan-price-free">Kostenlos</span>
							{:else}
								<span class="plan-price-amount">{formatPrice(price)}</span>
								<span class="plan-price-period"
									>/ {billingInterval === 'year' ? 'Jahr' : 'Monat'}</span
								>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Invoices -->
			{#if invoices.length > 0}
				<details class="invoices-details">
					<summary class="invoices-summary">Rechnungen ({invoices.length})</summary>
					<div class="invoices-list">
						{#each invoices as inv}
							<div class="invoice-row">
								<div class="invoice-info">
									<span class="invoice-number">{inv.number || '-'}</span>
									<span class="invoice-date">{formatDateShort(inv.createdAt)}</span>
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
					</div>
				</details>
			{/if}

			<!-- ── Tab: Transaktionen ───────────────────────── -->
		{:else if activeTab === 'transactions'}
			<Card>
				<h3 class="card-title">Transaktionsverlauf</h3>
				{#if transactions.length === 0}
					<p class="empty-hint">Noch keine Transaktionen vorhanden.</p>
				{:else}
					<div class="table-wrap">
						<table class="tx-table">
							<thead>
								<tr>
									<th>Typ</th>
									<th>Beschreibung</th>
									<th>App</th>
									<th class="text-right">Betrag</th>
									<th class="text-right">Kontostand</th>
									<th>Datum</th>
								</tr>
							</thead>
							<tbody>
								{#each transactions as tx}
									<tr>
										<td><span class="tx-icon-sm">{getTransactionIcon(tx.type)}</span></td>
										<td>{tx.description || '-'}</td>
										<td class="muted">{tx.appId || '-'}</td>
										<td class="text-right font-medium {getTransactionColor(tx.type)}">
											{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
										</td>
										<td class="text-right muted">{formatCredits(tx.balanceAfter)}</td>
										<td class="muted">{formatDate(tx.createdAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card>

			<!-- ── Tab: Credits kaufen ──────────────────────── -->
		{:else if activeTab === 'packages'}
			<div class="packages-grid">
				{#each packages as pkg}
					<Card>
						<div class="pkg-card">
							<h3 class="pkg-card-name">{pkg.name}</h3>
							{#if pkg.description}
								<p class="pkg-card-desc">{pkg.description}</p>
							{/if}
							<p class="pkg-card-credits">{formatCredits(pkg.credits)}</p>
							<p class="pkg-card-unit">Credits</p>
							<p class="pkg-card-price">{formatPrice(pkg.priceEuroCents)}</p>
							<button
								onclick={() => handleBuyPackage(pkg)}
								disabled={processingPackageId === pkg.id}
								class="btn btn-primary pkg-buy-btn"
							>
								{processingPackageId === pkg.id ? 'Wird geladen...' : 'Kaufen'}
							</button>
						</div>
					</Card>
				{/each}
			</div>
			{#if packages.length === 0}
				<Card>
					<p class="empty-hint">Aktuell sind keine Credit-Pakete verfügbar.</p>
				</Card>
			{/if}

			<!-- ── Tab: Kosten ──────────────────────────────── -->
		{:else if activeTab === 'costs'}
			<div class="cost-filters">
				{#each [{ key: 'all', label: 'Alle' }, { key: 'ai', label: 'KI-Features' }, { key: 'premium', label: 'Premium' }] as filter}
					<button
						onclick={() => (costFilter = filter.key as typeof costFilter)}
						class="filter-chip"
						class:active={costFilter === filter.key}
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<div class="info-banner">
				<p>
					Lesen, Bearbeiten, Löschen und Organisieren von Einträgen ist immer <strong
						>kostenlos</strong
					>. Credits werden nur für die unten aufgeführten Aktionen verbraucht.
				</p>
			</div>

			{@const groups = operationsByApp()}
			<div class="cost-groups">
				{#each Object.entries(groups) as [app, operations]}
					<Card>
						<h3 class="card-title">{getAppLabel(app)}</h3>
						<div class="cost-list">
							{#each operations as op}
								<div class="cost-row">
									<div class="cost-info">
										<p class="cost-name">{op.name}</p>
										<p class="cost-desc">{op.description}</p>
									</div>
									<div class="cost-right">
										<span class="cost-category">{getCategoryLabel(op.category)}</span>
										<span
											class="cost-badge"
											class:free={op.cost === 0}
											class:low={op.cost > 0 && op.cost < 1}
										>
											{op.cost === 0 ? 'Kostenlos' : op.formattedCost}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</Card>
				{/each}

				{#if Object.keys(groups).length === 0}
					<Card>
						<p class="empty-hint">Keine Operationen in dieser Kategorie.</p>
					</Card>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.credits-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	/* ── Balance grid ────────────────────────────────────── */
	.balance-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.balance-card {
		text-align: center;
		padding: 0.75rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
	}

	.balance-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.balance-value {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0.125rem 0 0;
		color: hsl(var(--color-foreground));
	}

	.balance-value.primary {
		color: hsl(var(--color-primary));
	}

	/* ── Tabs ────────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		overflow-x: auto;
		scrollbar-width: none;
	}

	.tab-bar::-webkit-scrollbar {
		display: none;
	}

	.tab-btn {
		flex-shrink: 0;
		padding: 0.5rem 0.75rem;
		margin-bottom: -1px;
		border: none;
		background: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: color 0.15s;
		white-space: nowrap;
	}

	.tab-btn:hover {
		color: hsl(var(--color-foreground));
	}

	.tab-btn.active {
		color: hsl(var(--color-primary));
		font-weight: 500;
		border-bottom: 2px solid hsl(var(--color-primary));
	}

	/* ── Overview ────────────────────────────────────────── */
	.overview-grid {
		display: grid;
		gap: 1rem;
	}

	.card-title {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: hsl(var(--color-foreground));
	}

	.empty-hint {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.tx-list {
		display: flex;
		flex-direction: column;
	}

	.tx-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.375rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.tx-row:last-child {
		border-bottom: none;
	}

	.tx-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tx-icon {
		font-size: 1rem;
	}

	.tx-desc {
		font-size: 0.8125rem;
		font-weight: 500;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.tx-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.tx-amount {
		font-weight: 600;
		font-size: 0.8125rem;
	}

	.link-btn {
		display: block;
		margin-top: 0.75rem;
		background: none;
		border: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-primary));
		cursor: pointer;
		padding: 0;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	.link-btn.danger {
		color: hsl(var(--color-error));
	}

	.link-btn:disabled {
		opacity: 0.5;
	}

	/* ── Quick buy ───────────────────────────────────────── */
	.quick-buy {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.quick-buy-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.625rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
		color: hsl(var(--color-foreground));
	}

	.quick-buy-btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}

	.quick-buy-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pkg-name {
		font-weight: 500;
		font-size: 0.8125rem;
		margin: 0;
	}

	.pkg-credits {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.pkg-price {
		font-weight: 600;
		color: hsl(var(--color-primary));
		font-size: 0.875rem;
	}

	/* ── Subscription tab ────────────────────────────────── */
	.status-card {
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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

	.sub-plan-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.status-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
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

	.sub-mana {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.portal-btn {
		flex-shrink: 0;
		padding: 0.1875rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.625rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
	}

	.portal-btn:hover {
		background: hsl(var(--color-surface-hover));
	}

	.status-details {
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
		margin-top: 0.375rem;
		padding-top: 0.375rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
	}

	.detail-label {
		color: hsl(var(--color-muted-foreground));
		min-width: 5rem;
	}

	.text-warn {
		color: hsl(45 93% 47%);
	}

	.interval-toggle {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
		padding: 0.1875rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.5rem;
	}

	.interval-btn {
		padding: 0.3125rem 0.625rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.6875rem;
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
		font-size: 0.5625rem;
		color: hsl(142 71% 45%);
	}

	.plans-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.plan-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		color: hsl(var(--color-foreground));
		font: inherit;
	}

	.plan-row:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.plan-row:disabled {
		cursor: default;
		opacity: 0.8;
	}

	.plan-row.current {
		border-color: hsl(var(--color-primary) / 0.35);
		background: hsl(var(--color-primary) / 0.05);
	}

	.plan-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	.plan-row-name {
		font-size: 0.8125rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.current-tag {
		font-size: 0.5625rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
	}

	.plan-row-mana {
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	.plan-features-preview {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.plan-price-col {
		flex-shrink: 0;
		text-align: right;
	}

	.plan-price-amount {
		font-size: 0.875rem;
		font-weight: 700;
		display: block;
	}

	.plan-price-free {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.plan-price-period {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Invoices ────────────────────────────────────────── */
	.invoices-details {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		overflow: hidden;
	}

	.invoices-summary {
		padding: 0.625rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		user-select: none;
	}

	.invoices-summary:hover {
		color: hsl(var(--color-foreground));
	}

	.invoices-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0 0.75rem 0.75rem;
	}

	.invoice-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.375rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.invoice-row:last-child {
		border-bottom: none;
	}

	.invoice-info {
		display: flex;
		flex-direction: column;
	}

	.invoice-number {
		font-family: monospace;
		font-size: 0.6875rem;
	}

	.invoice-date {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.invoice-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.invoice-amount {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.invoice-status {
		font-size: 0.5625rem;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background: hsl(45 93% 47% / 0.12);
		color: hsl(45 93% 47%);
	}

	.invoice-status.paid {
		background: hsl(142 71% 45% / 0.12);
		color: hsl(142 71% 45%);
	}

	.pdf-link {
		font-size: 0.625rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
	}

	.pdf-link:hover {
		text-decoration: underline;
	}

	/* ── Transactions table ──────────────────────────────── */
	.table-wrap {
		overflow-x: auto;
	}

	.tx-table {
		width: 100%;
		border-collapse: collapse;
	}

	.tx-table th {
		padding: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		text-align: left;
	}

	.tx-table td {
		padding: 0.5rem 0.375rem 0.5rem 0;
		font-size: 0.8125rem;
		border-bottom: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
	}

	.tx-table tr:last-child td {
		border-bottom: none;
	}

	.tx-icon-sm {
		font-size: 0.875rem;
	}

	.muted {
		color: hsl(var(--color-muted-foreground));
	}

	.font-medium {
		font-weight: 500;
	}

	.text-right {
		text-align: right;
	}

	.text-error {
		color: hsl(var(--color-error));
	}

	/* ── Packages grid ───────────────────────────────────── */
	.packages-grid {
		display: grid;
		gap: 0.75rem;
	}

	.pkg-card {
		text-align: center;
	}

	.pkg-card-name {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.pkg-card-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.25rem 0 0;
	}

	.pkg-card-credits {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
		margin: 0.75rem 0 0;
	}

	.pkg-card-unit {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.pkg-card-price {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0.75rem 0 0;
		color: hsl(var(--color-foreground));
	}

	.pkg-buy-btn {
		margin-top: 0.75rem;
		width: 100%;
	}

	/* ── Cost tab ────────────────────────────────────────── */
	.cost-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.filter-chip {
		padding: 0.3125rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-muted-foreground));
	}

	.filter-chip:hover {
		color: hsl(var(--color-foreground));
	}

	.filter-chip.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.info-banner {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: hsl(210 100% 95%);
		border: 1px solid hsl(210 100% 85%);
		font-size: 0.8125rem;
		color: hsl(210 50% 30%);
	}

	:global(.dark) .info-banner {
		background: hsl(210 50% 15%);
		border-color: hsl(210 50% 25%);
		color: hsl(210 50% 80%);
	}

	.cost-groups {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cost-list {
		display: flex;
		flex-direction: column;
	}

	.cost-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
		gap: 0.75rem;
	}

	.cost-row:last-child {
		border-bottom: none;
	}

	.cost-info {
		flex: 1;
		min-width: 0;
	}

	.cost-name {
		font-size: 0.8125rem;
		font-weight: 500;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.cost-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.0625rem 0 0;
	}

	.cost-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.cost-category {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.cost-badge {
		display: inline-flex;
		padding: 0.0625rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 600;
		background: hsl(210 100% 95%);
		color: hsl(210 50% 40%);
	}

	:global(.dark) .cost-badge {
		background: hsl(210 50% 20%);
		color: hsl(210 50% 80%);
	}

	.cost-badge.free {
		background: hsl(140 60% 92%);
		color: hsl(140 60% 30%);
	}

	:global(.dark) .cost-badge.free {
		background: hsl(140 40% 18%);
		color: hsl(140 50% 70%);
	}

	.cost-badge.low {
		background: hsl(45 100% 92%);
		color: hsl(45 80% 30%);
	}

	:global(.dark) .cost-badge.low {
		background: hsl(45 50% 18%);
		color: hsl(45 60% 70%);
	}

	/* ── Shared ──────────────────────────────────────────── */
	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
