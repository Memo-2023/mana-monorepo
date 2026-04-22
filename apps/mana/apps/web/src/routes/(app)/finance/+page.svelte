<script lang="ts">
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import type { Transaction, FinanceCategory, TransactionType } from '$lib/modules/finance/types';
	import {
		currentMonth,
		getMonthTotal,
		getMonthBalance,
		getTransactionsForMonth,
		getSpendingByCategory,
		formatCurrency,
		formatDateLabel,
		groupByDate,
	} from '$lib/modules/finance/queries';
	import { financeStore } from '$lib/modules/finance/stores/finance.svelte';
	import { RoutePage } from '$lib/components/shell';

	const txs$: Observable<Transaction[]> = getContext('transactions');
	const cats$: Observable<FinanceCategory[]> = getContext('financeCategories');

	let txs = $state<Transaction[]>([]);
	let categories = $state<FinanceCategory[]>([]);
	let isLoaded = $state(false);

	$effect(() => {
		const sub = txs$.subscribe((t) => {
			txs = t;
			isLoaded = true;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = cats$.subscribe((c) => (categories = c));
		return () => sub.unsubscribe();
	});

	let month = $state(currentMonth());
	let monthTxs = $derived(getTransactionsForMonth(txs, month));
	let income = $derived(getMonthTotal(txs, month, 'income'));
	let expenses = $derived(getMonthTotal(txs, month, 'expense'));
	let balance = $derived(getMonthBalance(txs, month));
	let spending = $derived(getSpendingByCategory(txs, month));
	let grouped = $derived(groupByDate(monthTxs));

	let catMap = $derived(new Map(categories.map((c) => [c.id, c])));
	let expenseCategories = $derived(categories.filter((c) => c.type === 'expense'));

	// Add form
	let showAdd = $state(false);
	let addType = $state<TransactionType>('expense');
	let addAmount = $state('');
	let addDesc = $state('');
	let addCatId = $state<string | null>(null);
	let filteredCats = $derived(categories.filter((c) => c.type === addType));

	async function handleAdd(e: Event) {
		e.preventDefault();
		const amount = parseFloat(addAmount.replace(',', '.'));
		if (!amount || !addDesc.trim()) return;
		await financeStore.addTransaction({
			type: addType,
			amount,
			description: addDesc.trim(),
			categoryId: addCatId,
		});
		addAmount = '';
		addDesc = '';
		addCatId = null;
		showAdd = false;
	}

	function prevMonth() {
		const d = new Date(month + '-01');
		d.setMonth(d.getMonth() - 1);
		month = d.toISOString().slice(0, 7);
	}

	function nextMonth() {
		const d = new Date(month + '-01');
		d.setMonth(d.getMonth() + 1);
		month = d.toISOString().slice(0, 7);
	}

	let monthLabel = $derived(
		new Date(month + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
	);

	let maxSpend = $derived(Math.max(1, ...spending.values()));
</script>

<svelte:head>
	<title>Finance - Mana</title>
</svelte:head>

<RoutePage appId="finance">
	<div class="finance-page">
		<header class="page-header">
			<h1 class="page-title">Finance</h1>
		</header>

		<!-- Month Navigation -->
		<div class="month-nav">
			<button class="nav-btn" onclick={prevMonth}>&larr;</button>
			<span class="month-label">{monthLabel}</span>
			<button class="nav-btn" onclick={nextMonth}>&rarr;</button>
		</div>

		{#if isLoaded}
			<!-- Summary Cards -->
			<div class="summary-cards">
				<div class="summary-card">
					<span class="card-label">Einnahmen</span>
					<span class="card-value income">+{formatCurrency(income)}</span>
				</div>
				<div class="summary-card">
					<span class="card-label">Ausgaben</span>
					<span class="card-value expense">-{formatCurrency(expenses)}</span>
				</div>
				<div class="summary-card highlight">
					<span class="card-label">Bilanz</span>
					<span class="card-value" class:income={balance >= 0} class:expense={balance < 0}>
						{balance >= 0 ? '+' : ''}{formatCurrency(balance)}
					</span>
				</div>
			</div>

			<!-- Category Breakdown -->
			{#if spending.size > 0}
				<section class="section">
					<h2 class="section-title">Ausgaben nach Kategorie</h2>
					<div class="cat-breakdown">
						{#each expenseCategories as cat (cat.id)}
							{@const amount = spending.get(cat.id) ?? 0}
							{#if amount > 0}
								<div class="cat-bar-row">
									<span class="cat-emoji">{cat.emoji}</span>
									<span class="cat-name">{cat.name}</span>
									<div class="cat-bar-bg">
										<div
											class="cat-bar-fill"
											style:width="{(amount / maxSpend) * 100}%"
											style:background={cat.color}
										></div>
									</div>
									<span class="cat-amount">{formatCurrency(amount)}</span>
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}

			<!-- Add Button -->
			<button class="add-btn" onclick={() => (showAdd = !showAdd)}>
				{showAdd ? 'Abbrechen' : '+ Transaktion hinzufügen'}
			</button>

			<!-- Add Form -->
			{#if showAdd}
				<form class="add-form" onsubmit={handleAdd}>
					<div class="type-toggle">
						<button
							type="button"
							class="type-btn"
							class:active={addType === 'expense'}
							onclick={() => (addType = 'expense')}>Ausgabe</button
						>
						<button
							type="button"
							class="type-btn inc"
							class:active={addType === 'income'}
							onclick={() => (addType = 'income')}>Einnahme</button
						>
					</div>
					<div class="amount-row">
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="amount-input"
							type="text"
							inputmode="decimal"
							placeholder="0,00"
							bind:value={addAmount}
							autofocus
						/>
						<span class="currency">\u20ac</span>
					</div>
					<input
						class="desc-input"
						type="text"
						placeholder="Beschreibung..."
						bind:value={addDesc}
					/>
					<div class="cat-chips">
						{#each filteredCats as cat (cat.id)}
							<button
								type="button"
								class="cat-chip"
								class:selected={addCatId === cat.id}
								onclick={() => (addCatId = addCatId === cat.id ? null : cat.id)}
							>
								{cat.emoji}
								{cat.name}
							</button>
						{/each}
					</div>
					<button type="submit" class="submit-btn" disabled={!addAmount || !addDesc.trim()}
						>Hinzufügen</button
					>
				</form>
			{/if}

			<!-- Transaction History -->
			{#if monthTxs.length > 0}
				<section class="section">
					<h2 class="section-title">Transaktionen</h2>
					<div class="tx-list">
						{#each [...grouped.entries()] as [date, dayTxs] (date)}
							<div class="day-header">{formatDateLabel(date)}</div>
							{#each dayTxs as tx (tx.id)}
								{@const cat = tx.categoryId ? catMap.get(tx.categoryId) : null}
								<div class="tx-row">
									<span class="tx-emoji">{cat?.emoji ?? '\ud83d\udcb3'}</span>
									<div class="tx-details">
										<span class="tx-desc">{tx.description}</span>
										{#if cat}<span class="tx-cat">{cat.name}</span>{/if}
									</div>
									<span
										class="tx-amount"
										class:income={tx.type === 'income'}
										class:expense={tx.type === 'expense'}
									>
										{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
									</span>
								</div>
							{/each}
						{/each}
					</div>
				</section>
			{/if}
		{:else}
			<div class="loading">Laden...</div>
		{/if}
	</div>
</RoutePage>

<style>
	.finance-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 0 1rem;
		max-width: 640px;
	}
	.page-header {
		display: flex;
		align-items: flex-start;
	}
	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.month-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	.nav-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.nav-btn:hover {
		background: hsl(var(--color-muted));
	}
	.month-label {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.summary-cards {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.5rem;
	}
	.summary-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 0.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
	}
	.summary-card.highlight {
		background: hsl(var(--color-primary) / 0.06);
	}
	.card-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.card-value {
		font-size: 1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		margin-top: 0.25rem;
	}
	.card-value.income {
		color: hsl(var(--color-success));
	}
	.card-value.expense {
		color: hsl(var(--color-error));
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.cat-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.cat-bar-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.cat-emoji {
		flex-shrink: 0;
	}
	.cat-name {
		width: 5rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cat-bar-bg {
		flex: 1;
		height: 0.5rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted));
		overflow: hidden;
	}
	.cat-bar-fill {
		height: 100%;
		border-radius: 0.25rem;
		transition: width 0.3s ease-out;
	}
	.cat-amount {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		flex-shrink: 0;
	}

	.add-btn {
		width: 100%;
		padding: 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: filter 0.15s;
	}
	.add-btn:hover {
		filter: brightness(1.1);
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.type-toggle {
		display: flex;
		gap: 0.375rem;
	}
	.type-btn {
		flex: 1;
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
	}
	.type-btn.active {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error) / 0.3);
	}
	.type-btn.inc.active {
		background: hsl(var(--color-success) / 0.15);
		color: hsl(var(--color-success));
		border-color: hsl(var(--color-success) / 0.3);
	}

	.amount-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.amount-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 1.75rem;
		font-weight: 700;
		padding: 0.25rem 0;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.amount-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.amount-input::placeholder {
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}
	.currency {
		color: hsl(var(--color-muted-foreground));
		font-size: 1.25rem;
	}

	.desc-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		padding: 0.5rem 0;
		outline: none;
	}
	.desc-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.cat-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.cat-chip {
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-chip:hover {
		background: hsl(var(--color-surface-hover));
	}
	.cat-chip.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.15);
	}

	.submit-btn {
		width: 100%;
		padding: 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}
	.submit-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.submit-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.day-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.5rem 0 0.25rem;
	}
	.tx-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.25rem;
	}
	.tx-emoji {
		font-size: 1.125rem;
		flex-shrink: 0;
	}
	.tx-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.tx-desc {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tx-cat {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.tx-amount {
		font-size: 0.875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.tx-amount.income {
		color: hsl(var(--color-success));
	}
	.tx-amount.expense {
		color: hsl(var(--color-error));
	}

	.loading {
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 3rem 0;
	}
</style>
