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
	import type { TransactionType } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { _ } from 'svelte-i18n';

	let { navigate, goBack, params }: ViewProps = $props();

	let txs$ = useAllTransactions();
	let cats$ = useAllCategories();
	let txs = $derived(txs$.value);
	let categories = $derived(cats$.value);

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
				}}>{$_('finance.page.type_expense')}</button
			>
			<button
				type="button"
				class="type-tab inc"
				class:active={addType === 'income'}
				onclick={() => {
					addType = 'income';
					addCatId = null;
				}}>{$_('finance.page.type_income')}</button
			>
		</div>
		<div class="input-row">
			<input
				class="amount-input"
				type="text"
				inputmode="decimal"
				placeholder={$_('finance.page.placeholder_amount')}
				bind:value={addAmount}
				onkeydown={handleKeydown}
			/>
			<span class="currency-label">&euro;</span>
			<input
				class="desc-input"
				type="text"
				placeholder={$_('finance.page.placeholder_description')}
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
			<span class="s-label">{$_('finance.page.summary_income')}</span>
		</div>
		<div class="summary-col">
			<span class="s-value expense">-{formatCurrency(expenses)}</span>
			<span class="s-label">{$_('finance.page.summary_expenses')}</span>
		</div>
		<div class="summary-col">
			<span class="s-value" class:income={balance >= 0} class:expense={balance < 0}>
				{balance >= 0 ? '+' : ''}{formatCurrency(balance)}
			</span>
			<span class="s-label">{$_('finance.page.summary_balance')}</span>
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
			<p class="empty">{$_('finance.list_view.empty_no_tx')}</p>
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

	/* P5: theme-token migration. income/expense semantic colors stay literal
	   (#22c55e, #ef4444) — these have specific meaning in finance UX (green
	   for money in, red for money out) and should NOT track theme primary. */
	.quick-add-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
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
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		transition: all 0.15s;
	}
	.type-tab:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}
	.type-tab.active {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error) / 0.25);
	}
	.type-tab.inc.active {
		background: hsl(var(--color-success) / 0.1);
		color: hsl(var(--color-success));
		border-color: hsl(var(--color-success) / 0.25);
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
		border-bottom: 1.5px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		font-weight: 700;
		padding: 0.25rem 0;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
	.amount-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.amount-input::placeholder {
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}
	.currency-label {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		flex-shrink: 0;
	}
	.desc-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1.5px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		outline: none;
		min-width: 0;
	}
	.desc-input:focus {
		border-color: hsl(var(--color-ring));
	}
	.desc-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.add-btn {
		width: 1.625rem;
		height: 1.625rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: filter 0.15s;
	}
	.add-btn:hover:not(:disabled) {
		filter: brightness(0.9);
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
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-chip:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.cat-chip.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
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
		background: hsl(var(--color-muted) / 0.5);
	}
	.s-value {
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.s-value.income {
		color: hsl(var(--color-success));
	}
	.s-value.expense {
		color: hsl(var(--color-error));
	}
	.s-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-foreground));
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tx-cat {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}
	.tx-amount {
		font-size: 0.75rem;
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
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.tx-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
	}
</style>
