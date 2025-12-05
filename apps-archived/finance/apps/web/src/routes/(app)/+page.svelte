<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboardStore, accountsStore, transactionsStore } from '$lib/stores';
	import { formatCurrency } from '@finance/shared';

	onMount(async () => {
		await Promise.all([dashboardStore.fetchDashboard(), accountsStore.fetchAccounts()]);
	});
</script>

<svelte:head>
	<title>Dashboard | Finance</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Dashboard</h1>

	{#if dashboardStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if dashboardStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{dashboardStore.error}</div>
	{:else if dashboardStore.data}
		<!-- Summary Cards -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- Total Balance -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h3 class="text-sm font-medium text-muted-foreground">Gesamtvermögen</h3>
				<p class="mt-2 text-3xl font-bold">{formatCurrency(dashboardStore.primaryTotal)}</p>
				{#if dashboardStore.data.totals.length > 1}
					<div class="mt-2 text-sm text-muted-foreground">
						{#each dashboardStore.data.totals as total}
							{#if total.currency !== 'EUR'}
								<span class="mr-2">{formatCurrency(total.amount, total.currency)}</span>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Monthly Income -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h3 class="text-sm font-medium text-muted-foreground">
					Einnahmen ({dashboardStore.data.currentMonth.month}/{dashboardStore.data.currentMonth
						.year})
				</h3>
				<p class="mt-2 text-3xl font-bold text-green-500">
					{formatCurrency(dashboardStore.data.currentMonth.income)}
				</p>
			</div>

			<!-- Monthly Expense -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h3 class="text-sm font-medium text-muted-foreground">
					Ausgaben ({dashboardStore.data.currentMonth.month}/{dashboardStore.data.currentMonth
						.year})
				</h3>
				<p class="mt-2 text-3xl font-bold text-red-500">
					{formatCurrency(dashboardStore.data.currentMonth.expense)}
				</p>
			</div>

			<!-- Monthly Net -->
			<div class="rounded-lg border border-border bg-card p-6">
				<h3 class="text-sm font-medium text-muted-foreground">
					Netto ({dashboardStore.data.currentMonth.month}/{dashboardStore.data.currentMonth.year})
				</h3>
				<p
					class="mt-2 text-3xl font-bold {dashboardStore.monthlyNet >= 0
						? 'text-green-500'
						: 'text-red-500'}"
				>
					{formatCurrency(dashboardStore.monthlyNet)}
				</p>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Accounts -->
			<div class="rounded-lg border border-border bg-card p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold">Konten</h2>
					<a href="/accounts" class="text-sm text-primary hover:underline">Alle anzeigen</a>
				</div>
				{#if accountsStore.activeAccounts.length === 0}
					<p class="text-muted-foreground">Noch keine Konten vorhanden.</p>
					<a href="/accounts" class="mt-2 inline-block text-sm text-primary hover:underline"
						>Konto erstellen</a
					>
				{:else}
					<div class="space-y-3">
						{#each accountsStore.activeAccounts.slice(0, 5) as account}
							<div class="flex items-center justify-between rounded-lg bg-accent/50 p-3">
								<div class="flex items-center gap-3">
									<div
										class="h-10 w-10 rounded-full flex items-center justify-center"
										style="background-color: {account.color || '#6b7280'}"
									>
										<span class="text-white text-sm font-medium">{account.name.charAt(0)}</span>
									</div>
									<div>
										<p class="font-medium">{account.name}</p>
										<p class="text-sm text-muted-foreground">{account.type}</p>
									</div>
								</div>
								<p class="font-semibold {parseFloat(account.balance) >= 0 ? '' : 'text-red-500'}">
									{formatCurrency(account.balance, account.currency)}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Budget Progress -->
			<div class="rounded-lg border border-border bg-card p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold">Budget-Fortschritt</h2>
					<a href="/budgets" class="text-sm text-primary hover:underline">Alle anzeigen</a>
				</div>
				{#if dashboardStore.budgetProgress.length === 0}
					<p class="text-muted-foreground">Noch keine Budgets definiert.</p>
					<a href="/budgets" class="mt-2 inline-block text-sm text-primary hover:underline"
						>Budget erstellen</a
					>
				{:else}
					<div class="space-y-4">
						{#each dashboardStore.budgetProgress.slice(0, 4) as budget}
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span>{budget.category?.name ?? 'Gesamt'}</span>
									<span class="text-muted-foreground"
										>{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span
									>
								</div>
								<div class="h-2 overflow-hidden rounded-full bg-accent">
									<div
										class="h-full transition-all {budget.percentage >= 1
											? 'bg-red-500'
											: budget.percentage >= 0.8
												? 'bg-yellow-500'
												: 'bg-green-500'}"
										style="width: {Math.min(budget.percentage * 100, 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="rounded-lg border border-border bg-card p-6">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Letzte Transaktionen</h2>
				<a href="/transactions" class="text-sm text-primary hover:underline">Alle anzeigen</a>
			</div>
			{#if dashboardStore.data.recentTransactions.length === 0}
				<p class="text-muted-foreground">Noch keine Transaktionen vorhanden.</p>
				<a href="/transactions" class="mt-2 inline-block text-sm text-primary hover:underline"
					>Transaktion erstellen</a
				>
			{:else}
				<div class="space-y-2">
					{#each dashboardStore.data.recentTransactions as transaction}
						<div class="flex items-center justify-between rounded-lg bg-accent/50 p-3">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center"
									style="background-color: {(transaction as any).category?.color || '#6b7280'}"
								>
									<span class="text-white text-sm"
										>{(transaction as any).category?.name?.charAt(0) ?? '?'}</span
									>
								</div>
								<div>
									<p class="font-medium">
										{(transaction as any).description ||
											(transaction as any).payee ||
											'Keine Beschreibung'}
									</p>
									<p class="text-sm text-muted-foreground">{(transaction as any).date}</p>
								</div>
							</div>
							<p
								class="font-semibold {(transaction as any).type === 'income'
									? 'text-green-500'
									: 'text-red-500'}"
							>
								{(transaction as any).type === 'income' ? '+' : '-'}{formatCurrency(
									(transaction as any).amount
								)}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
