import { apiClient } from './client';
import type { Transfer, CreateTransferInput, UpdateTransferInput } from '@finance/shared';

export const transfersApi = {
	getAll: () => apiClient.get<Transfer[]>('/transfers'),

	getOne: (id: string) => apiClient.get<Transfer>(`/transfers/${id}`),

	create: (data: CreateTransferInput) => apiClient.post<Transfer>('/transfers', data),

	update: (id: string, data: UpdateTransferInput) =>
		apiClient.put<Transfer>(`/transfers/${id}`, data),

	delete: (id: string) => apiClient.delete<{ success: boolean }>(`/transfers/${id}`),
};
