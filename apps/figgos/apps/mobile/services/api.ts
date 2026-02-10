import { authService } from '~/contexts/AuthContext';
import type { FigureResponse } from '@figgos/shared';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3025';

export async function fetchApi<T = any>(path: string, options?: RequestInit): Promise<T> {
	const token = await authService.getAccessToken?.();

	const response = await fetch(`${BACKEND_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options?.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API error: ${response.status}`);
	}

	return response.json();
}

export const api = {
	health: () => fetchApi('/health'),

	figures: {
		create: (name: string, description: string) =>
			fetchApi<{ figure: FigureResponse }>('/api/v1/figures', {
				method: 'POST',
				body: JSON.stringify({ name, description }),
			}),

		list: () => fetchApi<{ figures: FigureResponse[] }>('/api/v1/figures'),

		get: (id: string) => fetchApi<{ figure: FigureResponse }>(`/api/v1/figures/${id}`),

		delete: (id: string) =>
			fetchApi<{ success: boolean }>(`/api/v1/figures/${id}`, { method: 'DELETE' }),
	},
};
