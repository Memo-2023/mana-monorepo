const API_URL = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3018';

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
	token?: string
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string>),
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

export async function apiUpload<T>(
	endpoint: string,
	formData: FormData,
	token?: string
): Promise<T> {
	const headers: Record<string, string> = {};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		method: 'POST',
		headers,
		body: formData,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Upload failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

export function getDownloadUrl(endpoint: string): string {
	return `${API_URL}${endpoint}`;
}
