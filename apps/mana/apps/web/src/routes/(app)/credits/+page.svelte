<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card, PageHeader } from '@mana/shared-ui';
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

	let balance = $state<CreditBalance | null>(null);
	let transactions = $state<CreditTransaction[]>([]);
	let packages = $state<CreditPackage[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'transactions' | 'packages' | 'costs'>('overview');
	let costFilter = $state<'all' | 'ai' | 'productivity' | 'premium'>('all');

	// Build pricing data grouped by app
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
					if (costFilter === 'productivity') return op.category === CreditCategory.PRODUCTIVITY;
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
		// Sort apps alphabetically
		return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
	});

	const APP_LABELS: Record<string, string> = {
		calendar: 'Kalender',
		chat: 'Chat',
		contacts: 'Kontakte',
		context: 'Context',
		general: 'Allgemein',
		cards: 'Cards',
		nutriphi: 'NutriPhi',
		picture: 'Picture',
		planta: 'Planta',
		presi: 'Presi',
		questions: 'Questions',
		skilltree: 'SkillTree',
		todo: 'Todo',
		traces: 'Traces',
		zitare: 'Zitare',
	};

	function getAppLabel(app: string): string {
		return APP_LABELS[app] ?? app.charAt(0).toUpperCase() + app.slice(1);
	}

	function getCategoryLabel(category: CreditCategory): string {
		switch (category) {
			case CreditCategory.AI:
				return 'KI-Features';
			case CreditCategory.PRODUCTIVITY:
				return 'Erstellen';
			case CreditCategory.PREMIUM:
				return 'Premium';
			default:
				return category;
		}
	}
	let processingPackageId = $state<string | null>(null);

	// Toast notification
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Handle tab from URL params
	$effect(() => {
		const tab = $page.url.searchParams.get('tab');
		if (tab === 'packages') activeTab = 'packages';
		else if (tab === 'transactions') activeTab = 'transactions';
		else if (tab === 'costs') activeTab = 'costs';
		if (activeTab !== 'overview') ManaEvents.creditsTabViewed(activeTab);

		// Handle success/canceled from Stripe redirect
		const success = $page.url.searchParams.get('success');
		const canceled = $page.url.searchParams.get('canceled');

		if (success === 'true') {
			showToast('Credits wurden erfolgreich gekauft!', 'success');
			loadData();
			window.history.replaceState({}, '', '/credits');
		} else if (canceled === 'true') {
			showToast('Kauf wurde abgebrochen', 'error');
			window.history.replaceState({}, '', '/credits');
		}
	});

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		error = null;
		try {
			const [balanceData, transactionsData, packagesData] = await Promise.all([
				creditsService.getBalance(),
				creditsService.getTransactions(20),
				creditsService.getPackages(),
			]);
			balance = balanceData;
			transactions = transactionsData;
			packages = packagesData.filter((p) => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
		} catch (e) {
			error = e instanceof Error ? e.message : $_('common.error_loading');
			console.error('Failed to load credits data:', e);
		} finally {
			loading = false;
		}
	}

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
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	async function handleBuyPackage(pkg: CreditPackage) {
		processingPackageId = pkg.id;
		try {
			const result = await creditsService.initiatePurchase(pkg.id);
			// Redirect to Stripe Checkout
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

	function showToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}
</script>

<div>
	<PageHeader title="Credits" description="Verwalte deine Mana Credits" size="lg" />

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
		<!-- Balance Overview Cards -->
		<div class="grid gap-4 sm:grid-cols-3 mb-8">
			<Card>
				<div class="text-center">
					<p class="text-sm text-muted-foreground">Verfügbare Credits</p>
					<p class="text-3xl font-bold text-primary mt-1">
						{formatCredits(balance?.balance ?? 0)}
					</p>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<p class="text-sm text-muted-foreground">Gesamt erhalten</p>
					<p class="text-3xl font-bold mt-1">
						{formatCredits(balance?.totalEarned ?? 0)}
					</p>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<p class="text-sm text-muted-foreground">Gesamt verbraucht</p>
					<p class="text-3xl font-bold mt-1">
						{formatCredits(balance?.totalSpent ?? 0)}
					</p>
				</div>
			</Card>
		</div>

		<!-- Tabs -->
		<div class="flex gap-2 mb-6 border-b border-border">
			<button
				onclick={() => (activeTab = 'overview')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'overview'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Übersicht
			</button>
			<button
				onclick={() => (activeTab = 'transactions')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'transactions'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Transaktionen
			</button>
			<button
				onclick={() => (activeTab = 'packages')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'packages'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Credits kaufen
			</button>
			<button
				onclick={() => (activeTab = 'costs')}
				class="px-4 py-2 -mb-px transition-colors {activeTab === 'costs'
					? 'border-b-2 border-primary text-primary font-medium'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				Kosten
			</button>
		</div>

		<!-- Tab Content -->
		{#if activeTab === 'overview'}
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Recent Transactions -->
				<Card>
					<h3 class="text-lg font-semibold mb-4">Letzte Transaktionen</h3>
					{#if transactions.length === 0}
						<p class="text-muted-foreground text-sm">Noch keine Transaktionen</p>
					{:else}
						<div class="space-y-3">
							{#each transactions.slice(0, 5) as tx}
								<div
									class="flex items-center justify-between py-2 border-b border-border last:border-0"
								>
									<div class="flex items-center gap-3">
										<span class="text-xl">{getTransactionIcon(tx.type)}</span>
										<div>
											<p class="font-medium text-sm">{tx.description || tx.type}</p>
											<p class="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
										</div>
									</div>
									<span class="font-semibold {getTransactionColor(tx.type)}">
										{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
									</span>
								</div>
							{/each}
						</div>
						<button
							onclick={() => (activeTab = 'transactions')}
							class="mt-4 text-sm text-primary hover:underline"
						>
							Alle anzeigen →
						</button>
					{/if}
				</Card>

				<!-- Quick Buy -->
				<Card>
					<h3 class="text-lg font-semibold mb-4">Credits kaufen</h3>
					{#if packages.length === 0}
						<p class="text-muted-foreground text-sm">Keine Pakete verfügbar</p>
					{:else}
						<div class="space-y-3">
							{#each packages.slice(0, 3) as pkg}
								<button
									onclick={() => handleBuyPackage(pkg)}
									disabled={processingPackageId === pkg.id}
									class="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover transition-colors disabled:opacity-50"
								>
									<div class="text-left">
										<p class="font-medium">{pkg.name}</p>
										<p class="text-sm text-muted-foreground">
											{formatCredits(pkg.credits)} Credits
										</p>
									</div>
									{#if processingPackageId === pkg.id}
										<svg class="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
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
									{:else}
										<span class="font-semibold text-primary">{formatPrice(pkg.priceEuroCents)}</span
										>
									{/if}
								</button>
							{/each}
						</div>
						<button
							onclick={() => (activeTab = 'packages')}
							class="mt-4 text-sm text-primary hover:underline"
						>
							Alle Pakete →
						</button>
					{/if}
				</Card>
			</div>
		{:else if activeTab === 'transactions'}
			<Card>
				<h3 class="text-lg font-semibold mb-4">Transaktionsverlauf</h3>
				{#if transactions.length === 0}
					<p class="text-muted-foreground">Noch keine Transaktionen vorhanden.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-border text-left text-sm text-muted-foreground">
									<th class="pb-3 pr-4">Typ</th>
									<th class="pb-3 pr-4">Beschreibung</th>
									<th class="pb-3 pr-4">App</th>
									<th class="pb-3 pr-4 text-right">Betrag</th>
									<th class="pb-3 pr-4 text-right">Kontostand</th>
									<th class="pb-3">Datum</th>
								</tr>
							</thead>
							<tbody>
								{#each transactions as tx}
									<tr class="border-b border-border last:border-0">
										<td class="py-3 pr-4">
											<span class="text-lg">{getTransactionIcon(tx.type)}</span>
										</td>
										<td class="py-3 pr-4 text-sm">{tx.description || '-'}</td>
										<td class="py-3 pr-4 text-sm text-muted-foreground">{tx.appId || '-'}</td>
										<td class="py-3 pr-4 text-right font-medium {getTransactionColor(tx.type)}">
											{tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
										</td>
										<td class="py-3 pr-4 text-right text-sm text-muted-foreground">
											{formatCredits(tx.balanceAfter)}
										</td>
										<td class="py-3 text-sm text-muted-foreground">{formatDate(tx.createdAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card>
		{:else if activeTab === 'packages'}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each packages as pkg}
					<Card>
						<div class="text-center">
							<h3 class="text-xl font-bold">{pkg.name}</h3>
							{#if pkg.description}
								<p class="text-sm text-muted-foreground mt-1">{pkg.description}</p>
							{/if}
							<p class="text-4xl font-bold text-primary mt-4">
								{formatCredits(pkg.credits)}
							</p>
							<p class="text-sm text-muted-foreground">Credits</p>
							<p class="text-2xl font-semibold mt-4">
								{formatPrice(pkg.priceEuroCents)}
							</p>
							<button
								onclick={() => handleBuyPackage(pkg)}
								disabled={processingPackageId === pkg.id}
								class="mt-4 w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{#if processingPackageId === pkg.id}
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
									Wird geladen...
								{:else}
									Kaufen
								{/if}
							</button>
						</div>
					</Card>
				{/each}
			</div>
			{#if packages.length === 0}
				<Card>
					<p class="text-center text-muted-foreground py-8">
						Aktuell sind keine Credit-Pakete verfügbar.
					</p>
				</Card>
			{/if}
		{:else if activeTab === 'costs'}
			<!-- Category Filter -->
			<div class="flex flex-wrap gap-2 mb-6">
				{#each [{ key: 'all', label: 'Alle' }, { key: 'ai', label: 'KI-Features' }, { key: 'productivity', label: 'Erstellen' }, { key: 'premium', label: 'Premium' }] as filter}
					<button
						onclick={() => (costFilter = filter.key as typeof costFilter)}
						class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {costFilter ===
						filter.key
							? 'bg-primary text-primary-foreground'
							: 'bg-surface-hover text-muted-foreground hover:text-foreground'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<!-- Info -->
			<div
				class="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
			>
				<p class="text-sm text-blue-800 dark:text-blue-200">
					Lesen, Bearbeiten, Löschen und Organisieren von Einträgen ist immer <strong
						>kostenlos</strong
					>. Credits werden nur für die unten aufgeführten Aktionen verbraucht.
				</p>
			</div>

			<!-- Operations grouped by app -->
			{@const groups = operationsByApp()}
			<div class="space-y-4">
				{#each Object.entries(groups) as [app, operations]}
					<Card>
						<h3 class="text-lg font-semibold mb-4">{getAppLabel(app)}</h3>
						<div class="divide-y divide-border">
							{#each operations as op}
								<div class="flex items-center justify-between py-3">
									<div class="flex-1 min-w-0 pr-4">
										<p class="font-medium text-sm">{op.name}</p>
										<p class="text-xs text-muted-foreground mt-0.5">{op.description}</p>
									</div>
									<div class="flex items-center gap-3 flex-shrink-0">
										<span class="text-xs text-muted-foreground"
											>{getCategoryLabel(op.category)}</span
										>
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums {op.cost ===
											0
												? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
												: op.cost < 1
													? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
													: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}"
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
						<p class="text-center text-muted-foreground py-8">
							Keine Operationen in dieser Kategorie.
						</p>
					</Card>
				{/if}
			</div>
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
