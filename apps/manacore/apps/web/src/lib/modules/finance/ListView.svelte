<!--
  Finance — Workbench ListView
  Monthly overview with quick-add transaction and category breakdown.
-->
<script lang="ts">
	import {
		useAllTransactions,
		useAllCategories,
		currentMonth,
		getMonthTotal,
		getMonthBalance,
		getTransactionsForMonth,
		formatCurrency,
		formatDateLabel,
		groupByDate,
	} from './queries';
	import { financeStore } from './stores/finance.svelte';
	import type { Transaction, FinanceCategory, TransactionType } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let txs$ = useAllTransactions();
	let cats$ = useAllCategories();
	let txs = $state<Transaction[]>([]);
	let categories = $state<FinanceCategory[]>([]);

	$effect(() => {
		const sub = txs$.subscribe((val) => {
			txs = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = cats$.subscribe((val) => {
			categories = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	let month = currentMonth();
	let monthTxs = $derived(getTransactionsForMonth(txs, month));
	let income = $derived(getMonthTotal(txs, month, 'income'));
	let expenses = $derived(getMonthTotal(txs, month, 'expense'));
	let balance = $derived(getMonthBalance(txs, month));

	let catMap = $derived(new Map(categories.map((c) => [c.id, c])));

	// Recent transactions (last 10)
	let recentTxs = $derived(monthTxs.slice(0, 10));
	let grouped = $derived(groupByDate(recentTxs));

	// Quick add
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
</script>

<div class="finance-list-view">
	<!-- Monthly Summary -->
	<div class="month-summary">
		<div class="summary-row">
			<span class="summary-label">Einnahmen</span>
			<span class="summary-value income">+{formatCurrency(income)}</span>
		</div>
		<div class="summary-row">
			<span class="summary-label">Ausgaben</span>
			<span class="summary-value expense">-{formatCurrency(expenses)}</span>
		</div>
		<div class="summary-row balance">
			<span class="summary-label">Bilanz</span>
			<span class="summary-value" class:income={balance >= 0} class:expense={balance < 0}>
				{balance >= 0 ? '+' : ''}{formatCurrency(balance)}
			</span>
		</div>
	</div>

	<!-- Add Button -->
	{#if !showAdd}
		<button class="add-btn" onclick={() => (showAdd = true)}>+ Transaktion</button>
	{/if}

	<!-- Quick Add Form -->
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
					class="type-btn income"
					class:active={addType === 'income'}
					onclick={() => (addType = 'income')}>Einnahme</button
				>
			</div>
			<div class="add-row">
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
			<input class="desc-input" type="text" placeholder="Beschreibung..." bind:value={addDesc} />
			<div class="cat-row">
				{#each filteredCats as cat (cat.id)}
					<button
						type="button"
						class="cat-chip"
						class:selected={addCatId === cat.id}
						onclick={() => (addCatId = addCatId === cat.id ? null : cat.id)}
					>
						<span>{cat.emoji}</span>
						<span>{cat.name}</span>
					</button>
				{/each}
			</div>
			<div class="add-actions">
				<button type="button" class="btn-cancel" onclick={() => (showAdd = false)}>Abbrechen</button
				>
				<button type="submit" class="btn-save" disabled={!addAmount || !addDesc.trim()}
					>Hinzufügen</button
				>
			</div>
		</form>
	{/if}

	<!-- Recent Transactions -->
	{#if recentTxs.length > 0}
		<div class="tx-list">
			{#each [...grouped.entries()] as [date, dayTxs] (date)}
				<div class="day-label">{formatDateLabel(date)}</div>
				{#each dayTxs as tx (tx.id)}
					{@const cat = tx.categoryId ? catMap.get(tx.categoryId) : null}
					<div class="tx-row">
						<span class="tx-cat-emoji">{cat?.emoji ?? '\ud83d\udcb3'}</span>
						<div class="tx-info">
							<span class="tx-desc">{tx.description}</span>
							{#if cat}<span class="tx-cat-name">{cat.name}</span>{/if}
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
	{/if}

	{#if txs.length === 0 && !showAdd}
		<div class="empty">
			<p>Noch keine Transaktionen.</p>
			<button class="add-btn" onclick={() => (showAdd = true)}>Erste Transaktion</button>
		</div>
	{/if}
</div>

<style>
	.finance-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.5rem;
	}

	/* ── Summary ─────────────────────────────────── */
	.month-summary {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8125rem;
	}

	.summary-row.balance {
		padding-top: 0.375rem;
		margin-top: 0.25rem;
		border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		font-weight: 600;
	}

	.summary-label {
		color: var(--color-muted-foreground);
	}

	.summary-value {
		font-variant-numeric: tabular-nums;
	}
	.summary-value.income {
		color: #22c55e;
	}
	.summary-value.expense {
		color: #ef4444;
	}

	/* ── Add Form ────────────────────────────────── */
	.add-btn {
		width: 100%;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border: none;
		font-size: 0.8125rem;
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
		gap: 0.5rem;
		padding: 0.625rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.type-toggle {
		display: flex;
		gap: 0.25rem;
	}
	.type-btn {
		flex: 1;
		padding: 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		background: transparent;
		color: var(--color-muted-foreground);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		cursor: pointer;
	}
	.type-btn.active {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}
	.type-btn.income.active {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.3);
	}

	.add-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.amount-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-foreground);
		font-size: 1.25rem;
		font-weight: 700;
		padding: 0.25rem 0;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.amount-input:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.amount-input::placeholder {
		color: var(--color-muted-foreground);
		font-weight: 400;
	}

	.currency {
		color: var(--color-muted-foreground);
		font-size: 1rem;
	}

	.desc-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0.375rem 0;
		outline: none;
	}
	.desc-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.cat-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.cat-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-chip:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.cat-chip.selected {
		border-color: var(--color-primary, #6366f1);
		background: rgba(99, 102, 241, 0.15);
	}

	.add-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.btn-cancel,
	.btn-save {
		padding: 0.3rem 0.625rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn-cancel {
		background: transparent;
		color: var(--color-muted-foreground);
	}
	.btn-cancel:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}
	.btn-save {
		background: var(--color-primary, #6366f1);
		color: white;
	}
	.btn-save:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ── Transaction List ────────────────────────── */
	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.day-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		padding: 0.375rem 0 0.125rem;
	}

	.tx-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		border-radius: 0.375rem;
	}

	.tx-cat-emoji {
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.tx-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.tx-desc {
		font-size: 0.8125rem;
		color: var(--color-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tx-cat-name {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
	}

	.tx-amount {
		font-size: 0.8125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.tx-amount.income {
		color: #22c55e;
	}
	.tx-amount.expense {
		color: #ef4444;
	}

	/* ── Empty ──────────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}
</style>
