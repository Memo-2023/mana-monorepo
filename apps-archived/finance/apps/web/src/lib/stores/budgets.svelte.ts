import { budgetsApi, type BudgetWithSpending } from '$lib/api/budgets';
import type { CreateBudgetInput, UpdateBudgetInput } from '@finance/shared';

let budgets = $state<BudgetWithSpending[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);
let selectedMonth = $state(new Date().getMonth() + 1);
let selectedYear = $state(new Date().getFullYear());

export const budgetsStore = {
	get budgets() {
		return budgets;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	get selectedMonth() {
		return selectedMonth;
	},
	get selectedYear() {
		return selectedYear;
	},

	get totalBudgeted() {
		return budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
	},

	get totalSpent() {
		return budgets.reduce((sum, b) => sum + b.spent, 0);
	},

	get overBudgetCount() {
		return budgets.filter((b) => b.percentage >= 1).length;
	},

	setMonth(month: number, year: number) {
		selectedMonth = month;
		selectedYear = year;
	},

	async fetchBudgets() {
		isLoading = true;
		error = null;
		try {
			budgets = await budgetsApi.getByMonth(selectedYear, selectedMonth);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch budgets';
		} finally {
			isLoading = false;
		}
	},

	async createBudget(data: CreateBudgetInput) {
		isLoading = true;
		error = null;
		try {
			await budgetsApi.create(data);
			await this.fetchBudgets();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create budget';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async updateBudget(id: string, data: UpdateBudgetInput) {
		isLoading = true;
		error = null;
		try {
			await budgetsApi.update(id, data);
			await this.fetchBudgets();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update budget';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async deleteBudget(id: string) {
		isLoading = true;
		error = null;
		try {
			await budgetsApi.delete(id);
			budgets = budgets.filter((b) => b.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete budget';
			throw e;
		} finally {
			isLoading = false;
		}
	},

	async copyFromPreviousMonth() {
		try {
			const result = await budgetsApi.copyFromPreviousMonth(selectedYear, selectedMonth);
			if (result.copied > 0) {
				await this.fetchBudgets();
			}
			return result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to copy budgets';
			throw e;
		}
	},
};
