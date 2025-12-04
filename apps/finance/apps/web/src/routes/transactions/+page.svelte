<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionsStore, categoriesStore, accountsStore } from '$lib/stores';
	import { formatCurrency, formatDate } from '@finance/shared';
	import type { TransactionFilters } from '@finance/shared';

	let showFilters = $state(false);
	let filters = $state<TransactionFilters>({});

	onMount(async () => {
		await Promise.all([
			transactionsStore.fetchTransactions(),
			categoriesStore.fetchCategories(),
			accountsStore.fetchAccounts(),
		]);
	});

	async function applyFilters() {
		transactionsStore.setFilters(filters);
		await transactionsStore.fetchTransactions();
	}

	async function clearFilters() {
		filters = {};
		transactionsStore.clearFilters();
		await transactionsStore.fetchTransactions();
	}
</script>

<svelte:head>
	<title>Transaktionen | Finance</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Transaktionen</h1>
		<div class="flex gap-2">
			<button
				onclick={() => (showFilters = !showFilters)}
				class="rounded-lg border border-border px-4 py-2 hover:bg-accent"
			>
				{showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
			</button>
			<a
				href="/transactions/new"
				class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				+ Neu
			</a>
		</div>
	</div>

	<!-- Filters -->
	{#if showFilters}
		<div class="rounded-lg border border-border bg-card p-4">
			<div class="grid gap-4 md:grid-cols-4">
				<div>
					<label class="mb-1 block text-sm font-medium">Konto</label>
					<select
						bind:value={filters.accountId}
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					>
						<option value="">Alle Konten</option>
						{#each accountsStore.activeAccounts as account}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium">Kategorie</label>
					<select
						bind:value={filters.categoryId}
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					>
						<option value="">Alle Kategorien</option>
						{#each categoriesStore.categories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium">Typ</label>
					<select
						bind:value={filters.type}
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					>
						<option value="">Alle</option>
						<option value="income">Einnahme</option>
						<option value="expense">Ausgabe</option>
					</select>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium">Suche</label>
					<input
						type="text"
						bind:value={filters.search}
						placeholder="Beschreibung, Empfänger..."
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium">Von</label>
					<input
						type="date"
						bind:value={filters.startDate}
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium">Bis</label>
					<input
						type="date"
						bind:value={filters.endDate}
						class="w-full rounded-lg border border-border bg-background px-3 py-2"
					/>
				</div>
			</div>

			<div class="mt-4 flex gap-2">
				<button
					onclick={applyFilters}
					class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Filter anwenden
				</button>
				<button
					onclick={clearFilters}
					class="rounded-lg border border-border px-4 py-2 hover:bg-accent"
				>
					Zurücksetzen
				</button>
			</div>
		</div>
	{/if}

	<!-- Transaction List -->
	{#if transactionsStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if transactionsStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{transactionsStore.error}</div>
	{:else if transactionsStore.transactions.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
			<p class="text-muted-foreground">Keine Transaktionen gefunden.</p>
			<a
				href="/transactions/new"
				class="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				Erste Transaktion erstellen
			</a>
		</div>
	{:else}
		<div class="rounded-lg border border-border bg-card">
			<div class="divide-y divide-border">
				{#each transactionsStore.transactions as transaction}
					<a
						href="/transactions/{transaction.id}"
						class="flex items-center justify-between p-4 hover:bg-accent/50"
					>
						<div class="flex items-center gap-4">
							<div
								class="h-10 w-10 rounded-full flex items-center justify-center"
								style="background-color: {transaction.category?.color || '#6b7280'}"
							>
								<span class="text-white text-sm font-medium"
									>{transaction.category?.name?.charAt(0) ?? '?'}</span
								>
							</div>
							<div>
								<p class="font-medium">
									{transaction.description || transaction.payee || 'Keine Beschreibung'}
								</p>
								<p class="text-sm text-muted-foreground">
									{transaction.category?.name ?? 'Keine Kategorie'} • {formatDate(transaction.date)}
									• {transaction.account?.name}
								</p>
							</div>
						</div>
						<div class="text-right">
							<p
								class="font-semibold {transaction.type === 'income'
									? 'text-green-500'
									: 'text-red-500'}"
							>
								{transaction.type === 'income' ? '+' : '-'}{formatCurrency(
									transaction.amount,
									transaction.currency
								)}
							</p>
							{#if transaction.isPending}
								<span class="text-xs text-yellow-500">Ausstehend</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Pagination info -->
		<div class="text-center text-sm text-muted-foreground">
			{transactionsStore.transactions.length} von {transactionsStore.total} Transaktionen
		</div>
	{/if}
</div>
