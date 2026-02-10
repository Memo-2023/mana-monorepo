import { authService } from '~/contexts/AuthContext';

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
};
