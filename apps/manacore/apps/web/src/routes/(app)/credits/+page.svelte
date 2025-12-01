<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, PageHeader } from '@manacore/shared-ui';
	import {
		creditsService,
		type CreditBalance,
		type CreditTransaction,
		type CreditPackage,
	} from '$lib/api/credits';

	let balance = $state<CreditBalance | null>(null);
	let transactions = $state<CreditTransaction[]>([]);
	let packages = $state<CreditPackage[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeTab = $state<'overview' | 'transactions' | 'packages'>('overview');

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
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Daten';
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
			case 'bonus':
				return '🎁';
			case 'expiry':
				return '⏰';
			case 'adjustment':
				return '🔧';
			default:
				return '📝';
		}
	}

	function getTransactionColor(type: string): string {
		switch (type) {
			case 'purchase':
			case 'bonus':
			case 'refund':
				return 'text-green-600 dark:text-green-400';
			case 'usage':
			case 'expiry':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	function handleBuyPackage(pkg: CreditPackage) {
		// TODO: Integrate with Stripe
		alert(
			`Paket "${pkg.name}" kaufen\n\n${formatCredits(pkg.credits)} Credits für ${formatPrice(pkg.priceEuroCents)}\n\nStripe-Integration kommt bald!`
		);
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
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
					<p class="text-sm text-muted-foreground">Gratis-Credits heute</p>
					<p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
						{balance?.freeCreditsRemaining ?? 0} / {balance?.dailyFreeCredits ?? 5}
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
									class="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-hover transition-colors"
								>
									<div class="text-left">
										<p class="font-medium">{pkg.name}</p>
										<p class="text-sm text-muted-foreground">
											{formatCredits(pkg.credits)} Credits
										</p>
									</div>
									<span class="font-semibold text-primary">{formatPrice(pkg.priceEuroCents)}</span>
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
								class="mt-4 w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
							>
								Kaufen
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
		{/if}
	{/if}
</div>
