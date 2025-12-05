import { apiClient } from './client';
import type {
	Transaction,
	CreateTransactionInput,
	UpdateTransactionInput,
	TransactionFilters,
} from '@finance/shared';

interface PaginatedTransactions {
	data: Transaction[];
	total: number;
	limit: number;
	offset: number;
}

export const transactionsApi = {
	getAll: (filters?: TransactionFilters) => {
		const params = new URLSearchParams();
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					params.append(key, String(value));
				}
			});
		}
		const query = params.toString();
		return apiClient.get<PaginatedTransactions>(`/transactions${query ? `?${query}` : ''}`);
	},

	getRecent: (limit = 10) => apiClient.get<Transaction[]>(`/transactions/recent?limit=${limit}`),

	getSummary: (startDate: string, endDate: string) =>
		apiClient.get<{
			income: number;
			expense: number;
			net: number;
			incomeCount: number;
			expenseCount: number;
		}>(`/transactions/summary?startDate=${startDate}&endDate=${endDate}`),

	getOne: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`),

	create: (data: CreateTransactionInput) => apiClient.post<Transaction>('/transactions', data),

	update: (id: string, data: UpdateTransactionInput) =>
		apiClient.put<Transaction>(`/transactions/${id}`, data),

	delete: (id: string) => apiClient.delete<{ success: boolean }>(`/transactions/${id}`),
};
