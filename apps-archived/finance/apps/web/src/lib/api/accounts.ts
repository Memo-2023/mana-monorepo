import { apiClient } from './client';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@finance/shared';

export const accountsApi = {
	getAll: () => apiClient.get<Account[]>('/accounts'),

	getAllIncludingArchived: () => apiClient.get<Account[]>('/accounts/all'),

	getOne: (id: string) => apiClient.get<Account>(`/accounts/${id}`),

	getTotals: () =>
		apiClient.get<{ currency: string; total: number; count: number }[]>('/accounts/totals'),

	create: (data: CreateAccountInput) => apiClient.post<Account>('/accounts', data),

	update: (id: string, data: UpdateAccountInput) => apiClient.put<Account>(`/accounts/${id}`, data),

	delete: (id: string) => apiClient.delete<{ success: boolean }>(`/accounts/${id}`),

	archive: (id: string) => apiClient.post<Account>(`/accounts/${id}/archive`),

	unarchive: (id: string) => apiClient.post<Account>(`/accounts/${id}/unarchive`),

	reorder: (accountIds: string[]) => apiClient.put<Account[]>('/accounts/reorder', { accountIds }),
};
