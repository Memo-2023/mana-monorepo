import { apiClient } from './client';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '@finance/shared';

// Budget with computed spending fields from API
export interface BudgetWithSpending {
	id: string;
	userId: string;
	categoryId: string | null;
	month: number;
	year: number;
	amount: string;
	alertThreshold: string;
	rolloverEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
	spent: number;
	remaining: number;
	percentage: number;
	category?: {
		id: string;
		name: string;
		color: string;
		icon?: string;
	} | null;
}

export const budgetsApi = {
	getAll: () => apiClient.get<Budget[]>('/budgets'),

	getByMonth: (year: number, month: number) =>
		apiClient.get<BudgetWithSpending[]>(`/budgets/month/${year}/${month}`),

	getOne: (id: string) => apiClient.get<Budget>(`/budgets/${id}`),

	create: (data: CreateBudgetInput) => apiClient.post<Budget>('/budgets', data),

	update: (id: string, data: UpdateBudgetInput) => apiClient.put<Budget>(`/budgets/${id}`, data),

	delete: (id: string) => apiClient.delete<{ success: boolean }>(`/budgets/${id}`),

	copyFromPreviousMonth: (year: number, month: number) =>
		apiClient.post<{ message: string; copied: number }>('/budgets/copy', { year, month }),
};
