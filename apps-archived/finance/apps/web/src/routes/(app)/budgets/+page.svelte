<script lang="ts">
	import { onMount } from 'svelte';
	import { budgetsStore, categoriesStore } from '$lib/stores';
	import { formatCurrency, calculateBudgetPercentage, getBudgetStatus } from '@finance/shared';

	const months = [
		'Januar',
		'Februar',
		'März',
		'April',
		'Mai',
		'Juni',
		'Juli',
		'August',
		'September',
		'Oktober',
		'November',
		'Dezember',
	];

	onMount(async () => {
		await Promise.all([budgetsStore.fetchBudgets(), categoriesStore.fetchCategories()]);
	});

	function previousMonth() {
		if (budgetsStore.selectedMonth === 1) {
			budgetsStore.setMonth(12, budgetsStore.selectedYear - 1);
		} else {
			budgetsStore.setMonth(budgetsStore.selectedMonth - 1, budgetsStore.selectedYear);
		}
		budgetsStore.fetchBudgets();
	}

	function nextMonth() {
		if (budgetsStore.selectedMonth === 12) {
			budgetsStore.setMonth(1, budgetsStore.selectedYear + 1);
		} else {
			budgetsStore.setMonth(budgetsStore.selectedMonth + 1, budgetsStore.selectedYear);
		}
		budgetsStore.fetchBudgets();
	}

	async function copyFromPrevious() {
		await budgetsStore.copyFromPreviousMonth();
	}

	function getStatusColor(percentage: number) {
		const status = getBudgetStatus(percentage * 100);
		switch (status) {
			case 'over':
				return 'bg-red-500';
			case 'danger':
				return 'bg-red-400';
			case 'warning':
				return 'bg-yellow-500';
			default:
				return 'bg-green-500';
		}
	}
</script>

<svelte:head>
	<title>Budgets | Finance</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Budgets</h1>
		<a
			href="/budgets/new"
			class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
		>
			+ Neues Budget
		</a>
	</div>

	<!-- Month Selector -->
	<div class="flex items-center justify-center gap-4">
		<button onclick={previousMonth} class="rounded-lg border border-border p-2 hover:bg-accent"
			>&larr;</button
		>
		<span class="text-lg font-semibold">
			{months[budgetsStore.selectedMonth - 1]}
			{budgetsStore.selectedYear}
		</span>
		<button onclick={nextMonth} class="rounded-lg border border-border p-2 hover:bg-accent"
			>&rarr;</button
		>
	</div>

	<!-- Summary -->
	<div class="grid gap-4 md:grid-cols-3">
		<div class="rounded-lg border border-border bg-card p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Budgetiert</h3>
			<p class="mt-1 text-2xl font-bold">{formatCurrency(budgetsStore.totalBudgeted)}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Ausgegeben</h3>
			<p class="mt-1 text-2xl font-bold text-red-500">{formatCurrency(budgetsStore.totalSpent)}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<h3 class="text-sm font-medium text-muted-foreground">Verbleibend</h3>
			<p
				class="mt-1 text-2xl font-bold {budgetsStore.totalBudgeted - budgetsStore.totalSpent >= 0
					? 'text-green-500'
					: 'text-red-500'}"
			>
				{formatCurrency(budgetsStore.totalBudgeted - budgetsStore.totalSpent)}
			</p>
		</div>
	</div>

	{#if budgetsStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if budgetsStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{budgetsStore.error}</div>
	{:else if budgetsStore.budgets.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
			<p class="text-muted-foreground">Keine Budgets für diesen Monat definiert.</p>
			<div class="mt-4 flex justify-center gap-4">
				<button
					onclick={copyFromPrevious}
					class="rounded-lg border border-border px-4 py-2 hover:bg-accent"
				>
					Vom Vormonat kopieren
				</button>
				<a
					href="/budgets/new"
					class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Budget erstellen
				</a>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each budgetsStore.budgets as budget}
				<div class="rounded-lg border border-border bg-card p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							{#if budget.category}
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center"
									style="background-color: {budget.category.color || '#6b7280'}"
								>
									<span class="text-white font-medium">{budget.category.name.charAt(0)}</span>
								</div>
								<span class="font-medium">{budget.category.name}</span>
							{:else}
								<div class="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center">
									<span class="text-white font-medium">G</span>
								</div>
								<span class="font-medium">Gesamtbudget</span>
							{/if}
						</div>
						<div class="text-right">
							<p class="font-semibold">
								{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
							</p>
							<p class="text-sm {budget.remaining >= 0 ? 'text-green-500' : 'text-red-500'}">
								{budget.remaining >= 0
									? `${formatCurrency(budget.remaining)} übrig`
									: `${formatCurrency(Math.abs(budget.remaining))} über Budget`}
							</p>
						</div>
					</div>
					<div class="mt-3 h-3 overflow-hidden rounded-full bg-accent">
						<div
							class="h-full transition-all {getStatusColor(budget.percentage)}"
							style="width: {Math.min(budget.percentage * 100, 100)}%"
						></div>
					</div>
					<p class="mt-1 text-right text-sm text-muted-foreground">
						{Math.round(budget.percentage * 100)}%
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
