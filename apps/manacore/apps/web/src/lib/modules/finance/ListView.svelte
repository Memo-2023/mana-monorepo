<!--
  Finance — Workbench ListView
  Always-visible quick-add at top, monthly summary, recent transactions.
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

	// Always-visible quick add
	let addType = $state<TransactionType>('expense');
	let addAmount = $state('');
	let addDesc = $state('');
	let addCatId = $state<string | null>(null);
	let showCats = $state(false);

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
		showCats = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd(e);
		}
	}
</script>

<div class="finance-list-view">
	<!-- Always-visible Quick Add -->
	<form class="quick-add" onsubmit={handleAdd}>
		<div class="type-toggle">
			<button
				type="button"
				class="type-btn"
				class:active={addType === 'expense'}
				onclick={() => {
					addType = 'expense';
					addCatId = null;
				}}>Ausgabe</button
			>
			<button
				type="button"
				class="type-btn inc"
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
			<span class="currency">&euro;</span>
			<input
				class="desc-input"
				type="text"
				placeholder="Beschreibung..."
				bind:value={addDesc}
				onkeydown={handleKeydown}
			/>
			<button type="submit" class="submit-btn" disabled={!addAmount || !addDesc.trim()}>+</button>
		</div>
		<!-- Category chips -->
		<div class="cat-row">
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

	<!-- Monthly Summary -->
	<div class="month-summary">
		<div class="summary-item">
			<span class="summary-value income">+{formatCurrency(income)}</span>
			<span class="summary-label">Einnahmen</span>
		</div>
		<div class="summary-item">
			<span class="summary-value expense">-{formatCurrency(expenses)}</span>
			<span class="summary-label">Ausgaben</span>
		</div>
		<div class="summary-item">
			<span class="summary-value" class:income={balance >= 0} class:expense={balance < 0}>
				{balance >= 0 ? '+' : ''}{formatCurrency(balance)}
			</span>
			<span class="summary-label">Bilanz</span>
		</div>
	</div>

	<!-- Recent Transactions -->
	{#if recentTxs.length > 0}
		<div class="tx-list">
			{#each [...grouped.entries()] as [date, dayTxs] (date)}
				<div class="day-label">{formatDateLabel(date)}</div>
				{#each dayTxs as tx (tx.id)}
					{@const cat = tx.categoryId ? catMap.get(tx.categoryId) : null}
					<div class="tx-row">
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
		</div>
	{:else}
		<div class="empty">Noch keine Transaktionen diesen Monat.</div>
	{/if}
</div>

<style>
	.finance-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	/* ── Quick Add (always visible) ─────────────── */
	.quick-add {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		border-radius: 0.625rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.type-toggle {
		display: flex;
		gap: 0.25rem;
	}

	.type-btn {
		flex: 1;
		padding: 0.3rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		background: transparent;
		color: var(--color-muted-foreground);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		cursor: pointer;
		transition: all 0.15s;
	}
	.type-btn.active {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.25);
	}
	.type-btn.inc.active {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.25);
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
		border-bottom: 2px solid var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-foreground);
		font-size: 1rem;
		font-weight: 700;
		padding: 0.25rem 0;
		outline: none;
		text-align: right;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
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
		font-size: 0.8125rem;
		flex-shrink: 0;
	}

	.desc-input {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--color-border, rgba(255, 255, 255, 0.15));
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		outline: none;
		min-width: 0;
	}
	.desc-input:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.desc-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.submit-btn {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border: none;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: filter 0.15s;
	}
	.submit-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.submit-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.cat-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
	}

	.cat-chip {
		padding: 0.2rem 0.4rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-chip:hover {
		background: rgba(255, 255, 255, 0.08);
	}
	.cat-chip.selected {
		border-color: var(--color-primary, #6366f1);
		background: rgba(99, 102, 241, 0.12);
	}

	/* ── Summary ─────────────────────────────────── */
	.month-summary {
		display: flex;
		gap: 0.25rem;
	}

	.summary-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem 0.25rem;
		border-radius: 0.5rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.06));
	}

	.summary-value {
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.summary-value.income {
		color: #22c55e;
	}
	.summary-value.expense {
		color: #ef4444;
	}

	.summary-label {
		font-size: 0.5625rem;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	/* ── Transaction List ────────────────────────── */
	.tx-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.day-label {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		padding: 0.25rem 0 0.125rem;
	}

	.tx-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.125rem;
	}

	.tx-emoji {
		font-size: 0.8125rem;
		flex-shrink: 0;
	}

	.tx-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.tx-desc {
		font-size: 0.75rem;
		color: var(--color-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tx-cat {
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
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
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		padding: 1.5rem 0;
	}
</style>
