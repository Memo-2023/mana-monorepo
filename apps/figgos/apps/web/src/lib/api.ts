import type { FigureResponse } from '@figgos/shared';

const BACKEND_URL = 'http://localhost:3025';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BACKEND_URL}${path}`, {
		headers: { 'Content-Type': 'application/json', ...options?.headers },
		...options,
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `API error: ${res.status}`);
	}
	return res.json();
}

export const api = {
	figures: {
		create: (name: string, description: string, language = 'en') =>
			fetchApi<{ figure: FigureResponse }>('/api/v1/figures', {
				method: 'POST',
				body: JSON.stringify({ name, description, language }),
			}),
		list: () => fetchApi<{ figures: FigureResponse[] }>('/api/v1/figures'),
		get: (id: string) => fetchApi<{ figure: FigureResponse }>(`/api/v1/figures/${id}`),
		delete: (id: string) =>
			fetchApi<{ success: boolean }>(`/api/v1/figures/${id}`, { method: 'DELETE' }),
	},
};
