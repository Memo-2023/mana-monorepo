/**
 * Finance module — barrel exports.
 */

// ─── Stores ──────────────────────────────────────────────
export { financeStore } from './stores/finance.svelte';

// ─── Queries ─────────────────────────────────────────────
export {
	useAllTransactions,
	useAllCategories,
	toTransaction,
	toCategory,
	currentMonth,
	todayStr,
	getTransactionsForMonth,
	getMonthTotal,
	getMonthBalance,
	groupByDate,
	getSpendingByCategory,
	formatCurrency,
	formatDateLabel,
} from './queries';

// ─── Collections ─────────────────────────────────────────
export { transactionTable, categoryTable, budgetTable, FINANCE_GUEST_SEED } from './collections';

// ─── Types ───────────────────────────────────────────────
export { CATEGORY_COLORS } from './types';
export type {
	LocalTransaction,
	LocalFinanceCategory,
	LocalBudget,
	Transaction,
	FinanceCategory,
	Budget,
	TransactionType,
} from './types';
