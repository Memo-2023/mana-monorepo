<!--
  Finance — Workbench ListView
  Always-visible quick-add, monthly summary, recent transactions.
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
	let recentTxs = $derived(monthTxs.slice(0, 10));
	let grouped = $derived(groupByDate(recentTxs));

	// Quick add state
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
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd(e);
		}
	}
</script>

<div class="app-view">
	<!-- Quick Add -->
	<form class="quick-add-form" onsubmit={handleAdd}>
		<div class="type-tabs">
			<button
				type="button"
				class="type-tab"
				class:active={addType === 'expense'}
				onclick={() => {
					addType = 'expense';
					addCatId = null;
				}}>Ausgabe</button
			>
			<button
				type="button"
				class="type-tab inc"
				class:active={addType === 'income'}
				onclick={() => {
					addType = 'income';
					addCatId = null;
				}}>Einnahme</button
			>
		</div>
		<div class="input-row">
			<input
				class="amount-input"
				type="text"
				inputmode="decimal"
				placeholder="0,00"
				bind:value={addAmount}
				onkeydown={handleKeydown}
			/>
			<span class="currency-label">&euro;</span>
			<input
				class="desc-input"
				type="text"
				placeholder="Beschreibung..."
				bind:value={addDesc}
				onkeydown={handleKeydown}
			/>
			<button type="submit" class="add-btn" disabled={!addAmount || !addDesc.trim()}>+</button>
		</div>
		<div class="cat-chips">
			{#each filteredCats as cat (cat.id)}
				<button
					type="button"
					class="cat-chip"
					class:selected={addCatId === cat.id}
					onclick={() => (addCatId = addCatId === cat.id ? null : cat.id)}
					>{cat.emoji} {cat.name}</button
				>
			{/each}
		</div>
	</form>

	<!-- Summary -->
	<div class="summary">
		<div class="summary-col">
			<span class="s-value income">+{formatCurrency(income)}</span>
			<span class="s-label">Einnahmen</span>
		</div>
		<div class="summary-col">
			<span class="s-value expense">-{formatCurrency(expenses)}</span>
			<span class="s-label">Ausgaben</span>
		</div>
		<div class="summary-col">
			<span class="s-value" class:income={balance >= 0} class:expense={balance < 0}>
				{balance >= 0 ? '+' : ''}{formatCurrency(balance)}
			</span>
			<span class="s-label">Bilanz</span>
		</div>
	</div>

	<!-- Transactions -->
	<div class="tx-list">
		{#each [...grouped.entries()] as [date, dayTxs] (date)}
			<div class="day-label">{formatDateLabel(date)}</div>
			{#each dayTxs as tx (tx.id)}
				{@const cat = tx.categoryId ? catMap.get(tx.categoryId) : null}
				<div class="tx-item">
					<span class="tx-emoji">{cat?.emoji ?? '\ud83d\udcb3'}</span>
					<div class="tx-info">
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

		{#if recentTxs.length === 0}
			<p class="empty">Noch keine Transaktionen diesen Monat.</p>
		{/if}
	</div>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		height: 100%;
	}

	/* ── Quick Add Form ─────────────────────────── */
	.quick-add-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
	}
	:global(.dark) .quick-add-form {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.type-tabs {
		display: flex;
		gap: 0.25rem;
	}

	.type-tab {
		flex: 1;
		padding: 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		background: transparent;
		color: #9ca3af;
		border: 1px solid rgba(0, 0, 0, 0.06);
		cursor: pointer;
		transition: all 0.15s;
	}
	.type-tab:hover {
		color: #374151;
		background: rgba(0, 0, 0, 0.03);
	}
	.type-tab.active {
		background: rgba(239, 68, 68, 0.08);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
	}
	.type-tab.inc.active {
		background: rgba(34, 197, 94, 0.08);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.2);
	}
	:global(.dark) .type-tab {
		border-color: rgba(255, 255, 255, 0.06);
	}
	:global(.dark) .type-tab:hover {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.04);
	}
	:global(.dark) .type-tab.active {
		background: rgba(239, 68, 68, 0.12);
	}
	:global(.dark) .type-tab.inc.active {
		background: rgba(34, 197, 94, 0.12);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.amount-input {
		width: 4.5rem;
		background: transparent;
		border: none;
		border-bottom: 1.5px solid rgba(0, 0, 0, 0.1);
		color: #374151;
		font-size: 1rem;
		font-weight: 700;
		padding: 0.25rem 0;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.amount-input:focus {
		border-color: #6366f1;
	}
	.amount-input::placeholder {
		color: #c0bfba;
		font-weight: 400;
	}
	:global(.dark) .amount-input {
		border-color: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
	}
	:global(.dark) .amount-input::placeholder {
		color: #4b5563;
	}

	.currency-label {
		color: #9ca3af;
		font-size: 0.8125rem;
		flex-shrink: 0;
	}

	.desc-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1.5px solid rgba(0, 0, 0, 0.1);
		color: #374151;
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		outline: none;
		min-width: 0;
	}
	.desc-input:focus {
		border-color: #6366f1;
	}
	.desc-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .desc-input {
		border-color: rgba(255, 255, 255, 0.12);
		color: #f3f4f6;
	}
	:global(.dark) .desc-input::placeholder {
		color: #4b5563;
	}

	.add-btn {
		width: 1.625rem;
		height: 1.625rem;
		border-radius: 0.25rem;
		background: #6366f1;
		color: white;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.add-btn:hover:not(:disabled) {
		background: #5558e6;
	}
	.add-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.cat-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.1875rem;
	}

	.cat-chip {
		padding: 0.1875rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.08);
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-chip:hover {
		background: rgba(0, 0, 0, 0.03);
		color: #374151;
	}
	.cat-chip.selected {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.08);
		color: #6366f1;
	}
	:global(.dark) .cat-chip {
		border-color: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	:global(.dark) .cat-chip:hover {
		background: rgba(255, 255, 255, 0.04);
		color: #e5e7eb;
	}
	:global(.dark) .cat-chip.selected {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.15);
		color: #818cf8;
	}

	/* ── Summary ─────────────────────────────────── */
	.summary {
		display: flex;
		gap: 0.25rem;
	}

	.summary-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem 0.25rem;
		border-radius: 0.375rem;
		background: rgba(0, 0, 0, 0.02);
	}
	:global(.dark) .summary-col {
		background: rgba(255, 255, 255, 0.03);
	}

	.s-value {
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.s-value.income {
		color: #22c55e;
	}
	.s-value.expense {
		color: #ef4444;
	}

	.s-label {
		font-size: 0.5625rem;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	/* ── Transaction List ────────────────────────── */
	.tx-list {
		flex: 1;
		overflow-y: auto;
	}

	.day-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
		padding: 0.375rem 0 0.125rem;
	}

	.tx-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3rem 0.25rem;
		border-radius: 0.25rem;
	}

	.tx-emoji {
		font-size: 0.8125rem;
		flex-shrink: 0;
	}

	.tx-info {
		flex: 1;
		min-width: 0;
	}

	.tx-desc {
		font-size: 0.75rem;
		color: #374151;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .tx-desc {
		color: #e5e7eb;
	}

	.tx-cat {
		font-size: 0.625rem;
		color: #9ca3af;
	}

	.tx-amount {
		font-size: 0.75rem;
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

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
