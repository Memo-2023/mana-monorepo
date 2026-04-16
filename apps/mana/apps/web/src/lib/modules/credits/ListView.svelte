<!--
  Credits & Abo — Workbench-embedded billing hub. Merges the former
  /credits (balance, transactions, packages, cost breakdown) with
  /mana (subscription plans) into a single tabbed view.

  Stripe redirect handling: after checkout Stripe sends the user back
  to /?app=credits&success=true (or &canceled=true). The workbench
  deep-link handler opens this app and strips ?app, leaving ?success=
  in the URL for us to read here.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { Card } from '@mana/shared-ui';
	import { SubscriptionPage } from '@mana/subscriptions';
	import {
		creditsService,
		type CreditBalance,
		type CreditTransaction,
		type CreditPackage,
	} from '$lib/api/credits';
	import {
		OPERATION_METADATA,
		CREDIT_COSTS,
		CreditCategory,
		formatCreditCost,
		type CreditOperationType,
	} from '@mana/credits';
	import { ManaEvents } from '@mana/shared-utils/analytics';
	import { authStore } from '$lib/stores/auth.svelte';

	let balance = $state<CreditBalance | null>(null);
	let transactions = $state<CreditTransaction[]>([]);
	let packages = $state<CreditPackage[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'subscriptions' | 'transactions' | 'packages' | 'costs'>(
		'overview'
	);
	let costFilter = $state<'all' | 'ai' | 'premium'>('all');
	let processingPackageId = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

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
		// Read URL params for tab selection + Stripe redirect
		const params = new URLSearchParams(window.location.search);
		const tab = params.get('tab');
		if (tab === 'packages') activeTab = 'packages';
		else if (tab === 'transactions') activeTab = 'transactions';
		else if (tab === 'costs') activeTab = 'costs';
		else if (tab === 'subscriptions') activeTab = 'subscriptions';

		const success = params.get('success');
		const canceled = params.get('canceled');

		if (success === 'true') {
			showToast('Credits wurden erfolgreich gekauft!', 'success');
			// Clean Stripe params from URL
			history.replaceState({}, '', '/');
		} else if (canceled === 'true') {
			showToast('Kauf wurde abgebrochen', 'error');
			history.replaceState({}, '', '/');
		}

		if (activeTab !== 'overview') ManaEvents.creditsTabViewed(activeTab);
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;

		// API calls require auth — skip for guests, still show costs tab (static data)
		if (!authStore.isAuthenticated) {
			loading = false;
			return;
		}

		// Load each independently so a single 401/failure doesn't blank the whole page
		const results = await Promise.allSettled([
			creditsService.getBalance(),
			creditsService.getTransactions(20),
			creditsService.getPackages(),
		]);

		if (results[0].status === 'fulfilled') balance = results[0].value;
		if (results[1].status === 'fulfilled') transactions = results[1].value;
		if (results[2].status === 'fulfilled') {
			packages = results[2].value.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
		}

		// Only show error if ALL three failed
		const allFailed = results.every((r) => r.status === 'rejected');
		if (allFailed) {
			const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
			error =
				firstErr.reason instanceof Error ? firstErr.reason.message : $_('common.error_loading');
		}

		loading = false;
	}

	// ── Helpers ────────────────────────────────────────────
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

	async function handleBuyPackage(pkg: CreditPackage) {
		processingPackageId = pkg.id;
		try {
			const result = await creditsService.initiatePurchase(pkg.id);
			window.location.href = result.checkoutUrl;
		} catch (e) {
			showToast(
				e instanceof Error ? e.message : 'Fehler beim Erstellen der Checkout-Session',
				'error'
			);
		} finally {
			processingPackageId = null;
		}
	}

	function handleSubscribe(planId: string) {
		showToast(`Abo "${planId}" ausgewählt. Bezahlsystem wird in Kürze integriert.`, 'success');
	}

	function handleBuySubscriptionPackage(packageId: string) {
		showToast(`Paket "${packageId}" ausgewählt. Bezahlsystem wird in Kürze integriert.`, 'success');
	}

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => (toastMessage = null), 4000);
	}
</script>

<div class="credits-page">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
		</div>
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
			{#each [{ key: 'overview', label: 'Übersicht' }, { key: 'subscriptions', label: 'Abonnements' }, { key: 'transactions', label: 'Transaktionen' }, { key: 'packages', label: 'Kaufen' }, { key: 'costs', label: 'Kosten' }] as tab}
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
			<SubscriptionPage
				appName="Mana"
				onSubscribe={handleSubscribe}
				onBuyPackage={handleBuySubscriptionPackage}
				currentPlanId="free"
				pageTitle="Wähle dein Abo"
				subscriptionsTitle="Abonnements"
				packagesTitle="Einmal-Pakete"
				yearlyDiscount="20% Rabatt"
			/>

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

{#if toastMessage}
	<div class="toast" class:toast-error={toastType === 'error'}>
		{toastMessage}
	</div>
{/if}

<style>
	.credits-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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
		padding: 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
	}

	.balance-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.balance-value {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0.25rem 0 0;
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
		padding: 0.5rem 1rem;
		margin-bottom: -1px;
		border: none;
		background: none;
		font-size: 0.875rem;
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
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.overview-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.card-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: hsl(var(--color-foreground));
	}

	.empty-hint {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}

	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tx-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.tx-row:last-child {
		border-bottom: none;
	}

	.tx-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.tx-icon {
		font-size: 1.25rem;
	}

	.tx-desc {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.tx-date {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.tx-amount {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.link-btn {
		display: block;
		margin-top: 1rem;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: hsl(var(--color-primary));
		cursor: pointer;
		padding: 0;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	/* ── Quick buy ───────────────────────────────────────── */
	.quick-buy {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quick-buy-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem;
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
		margin: 0;
	}

	.pkg-credits {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.pkg-price {
		font-weight: 600;
		color: hsl(var(--color-primary));
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
		padding: 0 0 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		text-align: left;
	}

	.tx-table td {
		padding: 0.75rem 0.5rem 0.75rem 0;
		font-size: 0.875rem;
		border-bottom: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
	}

	.tx-table tr:last-child td {
		border-bottom: none;
	}

	.tx-icon-sm {
		font-size: 1rem;
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
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.packages-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.packages-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.pkg-card {
		text-align: center;
	}

	.pkg-card-name {
		font-size: 1.125rem;
		font-weight: 700;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.pkg-card-desc {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.25rem 0 0;
	}

	.pkg-card-credits {
		font-size: 2rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
		margin: 1rem 0 0;
	}

	.pkg-card-unit {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.pkg-card-price {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1rem 0 0;
		color: hsl(var(--color-foreground));
	}

	.pkg-buy-btn {
		margin-top: 1rem;
		width: 100%;
	}

	/* ── Cost tab ────────────────────────────────────────── */
	.cost-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-chip {
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
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
		padding: 1rem;
		border-radius: 0.5rem;
		background: hsl(210 100% 95%);
		border: 1px solid hsl(210 100% 85%);
		font-size: 0.875rem;
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
		gap: 1rem;
	}

	.cost-list {
		display: flex;
		flex-direction: column;
	}

	.cost-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
		gap: 1rem;
	}

	.cost-row:last-child {
		border-bottom: none;
	}

	.cost-info {
		flex: 1;
		min-width: 0;
	}

	.cost-name {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.cost-desc {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.125rem 0 0;
	}

	.cost-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.cost-category {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.cost-badge {
		display: inline-flex;
		padding: 0.125rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
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
		font-size: 0.875rem;
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
		animation: fadeIn 0.2s ease-out;
	}

	.toast-error {
		background: hsl(var(--color-error));
	}

	@keyframes fadeIn {
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
